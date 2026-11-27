import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = join(repositoryRoot, "docs");
const siteOrigin =
  "https://izikipizi.github.io/nizlo-msp-operations-resources/";

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else files.push(path);
  }
  return files;
}

function matchOne(source, pattern, label, path) {
  const match = source.match(pattern);
  if (!match) throw new Error(`${path}: missing ${label}`);
  return match[1];
}

function* datasetEntities(value) {
  if (!value || typeof value !== "object") return;
  const types = [value["@type"]].flat();
  if (types.includes("Dataset") || types.includes("sc:Dataset")) yield value;
  for (const child of Object.values(value)) yield* datasetEntities(child);
}

function localUrlFor(path) {
  const relativePath = relative(docsRoot, path).replaceAll("\\", "/");
  if (relativePath === "index.html") return siteOrigin;
  if (relativePath.endsWith("/index.html")) {
    return `${siteOrigin}${relativePath.slice(0, -"index.html".length)}`;
  }
  return `${siteOrigin}${relativePath}`;
}

function parseCsvHeader(source) {
  const fields = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      fields.push(field);
      return fields;
    } else {
      field += character;
    }
  }
  fields.push(field);
  return fields;
}

const allFiles = await listFiles(docsRoot);
const htmlFiles = allFiles.filter((path) => path.endsWith(".html"));
const sitemap = await readFile(join(docsRoot, "sitemap.xml"), "utf8");
const sitemapUrls = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
);

const errors = [];

const [repositoryIndex, hostedIndex] = await Promise.all(
  [repositoryRoot, docsRoot].map(async (directory) =>
    JSON.parse(await readFile(join(directory, "resource-index.json"), "utf8")),
  ),
);
for (const group of ["resources", "templates", "datasets"]) {
  for (const index of [repositoryIndex, hostedIndex]) {
    const entries = index[group];
    if (new Set(entries.map(({ id }) => id)).size !== entries.length) {
      errors.push(`resource-index.json: duplicate IDs in ${group}`);
    }
    entries.sort((left, right) => left.id.localeCompare(right.id));
  }
}
if (!isDeepStrictEqual(repositoryIndex, hostedIndex)) {
  errors.push("resource-index.json: the repository and hosted indexes differ");
}

const publishedPaths = new Set(
  allFiles.map((path) => new URL(localUrlFor(path)).pathname),
);
for (const group of ["resources", "templates", "datasets"]) {
  for (const { id, ...fields } of repositoryIndex[group]) {
    for (const [field, value] of Object.entries(fields)) {
      if (typeof value !== "string" || !value.startsWith(siteOrigin)) continue;
      if (!publishedPaths.has(new URL(value).pathname)) {
        errors.push(`resource-index.json: ${id} has a missing local ${field}: ${value}`);
      }
    }
  }
}

const htmlSitemapPath = join(docsRoot, "sitemap-pages.txt");
const expectedHtmlSitemap = `${htmlFiles.map(localUrlFor).sort().join("\n")}\n`;
if (process.argv.includes("--write-html-sitemap")) {
  await writeFile(htmlSitemapPath, expectedHtmlSitemap, "utf8");
}
const htmlSitemap = await readFile(htmlSitemapPath, "utf8");
if (htmlSitemap.replaceAll("\r\n", "\n") !== expectedHtmlSitemap) {
  errors.push(
    "docs/sitemap-pages.txt is stale. Run node scripts/verify-resource-hub.mjs --write-html-sitemap.",
  );
}

const dataPackagePath = join(docsRoot, "datapackage.json");
const dataPackage = JSON.parse(await readFile(dataPackagePath, "utf8"));
const packagePaths = new Set(
  dataPackage.resources.map((resource) => resource.path),
);
const expectedPackagePaths = new Set(
  allFiles
    .filter(
      (path) =>
        path.endsWith(".csv") &&
        relative(docsRoot, path).replaceAll("\\", "/").startsWith("templates/"),
    )
    .map((path) => relative(docsRoot, path).replaceAll("\\", "/")),
);
expectedPackagePaths.add("data/public-rmm-pricing-comparison-2026-11-02.csv");
expectedPackagePaths.add("data/public-rmm-pricing-comparison-2026-11-26.csv");
for (const path of expectedPackagePaths) {
  if (!packagePaths.has(path))
    errors.push(`docs/datapackage.json: missing ${path}`);
}
for (const path of packagePaths) {
  if (!expectedPackagePaths.has(path))
    errors.push(`docs/datapackage.json: unexpected ${path}`);
}
for (const resource of dataPackage.resources) {
  const path = join(docsRoot, resource.path);
  try {
    const content = await readFile(path);
    const hash = `sha256:${createHash("sha256").update(content).digest("hex")}`;
    if (resource.bytes !== content.byteLength) {
      errors.push(
        `docs/datapackage.json: ${resource.path} byte count ${resource.bytes} does not match ${content.byteLength}`,
      );
    }
    if (resource.hash !== hash) {
      errors.push(
        `docs/datapackage.json: ${resource.path} hash does not match`,
      );
    }
    const header = parseCsvHeader(content.toString("utf8"));
    const fields = resource.schema?.fields?.map((field) => field.name) ?? [];
    if (JSON.stringify(header) !== JSON.stringify(fields)) {
      errors.push(
        `docs/datapackage.json: ${resource.path} schema fields do not match its CSV header`,
      );
    }
  } catch (error) {
    errors.push(
      `docs/datapackage.json: cannot verify ${resource.path}: ${error.message}`,
    );
  }
}

const citation = await readFile(join(repositoryRoot, "CITATION.cff"), "utf8");
const citationVersion = matchOne(
  citation,
  /^version:\s*"([^"]+)"/m,
  "version",
  "CITATION.cff",
);
if (citationVersion !== dataPackage.version) {
  errors.push(
    `CITATION.cff: version ${citationVersion} does not match Data Package ${dataPackage.version}`,
  );
}
for (const relativePath of [
  "README.md",
  "docs/citation.html",
  "docs/index.html",
]) {
  const source = await readFile(join(repositoryRoot, relativePath), "utf8");
  if (!source.includes(`v${dataPackage.version}`)) {
    errors.push(
      `${relativePath}: missing current version v${dataPackage.version}`,
    );
  }
}

const feed = await readFile(join(docsRoot, "feed.xml"), "utf8");
const feedUpdated = matchOne(
  feed,
  /<feed[^>]*>[\s\S]*?<updated>([^<]+)<\/updated>/,
  "feed updated timestamp",
  "docs/feed.xml",
);
const feedEntries = [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(
  ([, entry]) => ({
    id: matchOne(entry, /<id>([^<]+)<\/id>/, "entry id", "docs/feed.xml"),
    updated: matchOne(
      entry,
      /<updated>([^<]+)<\/updated>/,
      "entry updated timestamp",
      "docs/feed.xml",
    ),
  }),
);
const latestFeedEntry = [...feedEntries].sort((left, right) =>
  right.updated.localeCompare(left.updated),
)[0];
if (!latestFeedEntry)
  errors.push("docs/feed.xml: feed must contain at least one entry");
else {
  if (feedUpdated !== latestFeedEntry.updated) {
    errors.push(
      `docs/feed.xml: feed updated ${feedUpdated} does not match latest entry ${latestFeedEntry.updated}`,
    );
  }
  if (feedEntries[0].updated !== latestFeedEntry.updated) {
    errors.push(
      "docs/feed.xml: an entry with the latest update must appear first",
    );
  }
}
if (new Set(feedEntries.map((entry) => entry.id)).size !== feedEntries.length) {
  errors.push("docs/feed.xml: entry IDs must be unique");
}

const intuneMatrixCanonical = await readFile(
  join(docsRoot, "templates", "rmm-vs-mdm-responsibility-matrix.csv"),
  "utf8",
);
const intuneMatrixSubmissionAlias = await readFile(
  join(
    docsRoot,
    "downloads",
    "rmm-vs-remote-support-vs-mdm-vs-endpoint-management.csv",
  ),
  "utf8",
);
if (intuneMatrixSubmissionAlias !== intuneMatrixCanonical) {
  errors.push(
    "Awesome Intune download alias must match templates/rmm-vs-mdm-responsibility-matrix.csv",
  );
}

for (const path of htmlFiles) {
  const relativePath = relative(repositoryRoot, path).replaceAll("\\", "/");
  const source = await readFile(path, "utf8");
  try {
    const description = matchOne(
      source,
      /<meta\s+name="description"\s+content="([^"]+)"\s*\/?>/s,
      "meta description",
      relativePath,
    );
    if (description.length < 50 || description.length > 400) {
      throw new Error(
        `${relativePath}: meta description length is ${description.length}`,
      );
    }

    const canonical = matchOne(
      source,
      /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/s,
      "canonical URL",
      relativePath,
    );
    const expectedCanonical = localUrlFor(path);
    if (canonical !== expectedCanonical) {
      throw new Error(
        `${relativePath}: canonical ${canonical} does not match ${expectedCanonical}`,
      );
    }
    if (!sitemapUrls.has(canonical)) {
      throw new Error(`${relativePath}: canonical is absent from sitemap.xml`);
    }

    const h1Count = (source.match(/<h1(?:\s|>)/g) ?? []).length;
    if (h1Count !== 1)
      throw new Error(`${relativePath}: expected one h1, found ${h1Count}`);

    const jsonLdBlocks = [
      ...source.matchAll(
        /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      ),
    ];
    if (jsonLdBlocks.length === 0)
      throw new Error(`${relativePath}: missing JSON-LD`);
    const structuredData = jsonLdBlocks.map(([, json]) => JSON.parse(json));
    const datasets = [...datasetEntities(structuredData)];
    for (const dataset of datasets) {
      for (const field of ["name", "description"]) {
        if (typeof dataset[field] !== "string" || !dataset[field].trim()) {
          throw new Error(`${relativePath}: Dataset is missing ${field}`);
        }
      }
      if (!dataset.creator) {
        throw new Error(`${relativePath}: Dataset is missing creator`);
      }
    }
    if (relativePath === "docs/public-rmm-pricing-dataset.html") {
      if (
        datasets.length !== 1 ||
        datasets[0]["@context"] !== "https://schema.org"
      ) {
        throw new Error(
          `${relativePath}: expected one Schema.org Dataset with a name and description; keep Croissant metadata in its linked file`,
        );
      }
    }

    for (const match of source.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (/^(?:https?:|mailto:|tel:|#|data:|javascript:)/.test(href)) continue;
      const cleanHref = href.split(/[?#]/, 1)[0];
      if (!cleanHref) continue;
      let target = resolve(dirname(path), cleanHref);
      if (cleanHref.endsWith("/")) target = join(target, "index.html");
      try {
        if (!(await stat(target)).isFile()) throw new Error();
      } catch {
        throw new Error(`${relativePath}: broken internal link ${href}`);
      }
    }
  } catch (error) {
    errors.push(error.message);
  }
}

const homepage = await readFile(join(docsRoot, "index.html"), "utf8");
const homepageJsonLd = [
  ...homepage.matchAll(
    /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  ),
].map((match) => JSON.parse(match[1]));
const collectionPage = homepageJsonLd.find(
  (entry) => entry["@type"] === "CollectionPage",
);
if (!collectionPage)
  errors.push("docs/index.html: missing CollectionPage JSON-LD");
else {
  const itemList = collectionPage.mainEntity;
  const items = itemList?.itemListElement ?? [];
  const positions = items.map((item) => Number(item.position));
  const expectedPositions = Array.from(
    { length: items.length },
    (_, index) => index + 1,
  );
  if (itemList.numberOfItems !== items.length) {
    errors.push(
      `docs/index.html: numberOfItems is ${itemList.numberOfItems}, but ${items.length} items exist`,
    );
  }
  if (
    JSON.stringify([...positions].sort((a, b) => a - b)) !==
    JSON.stringify(expectedPositions)
  ) {
    errors.push(
      "docs/index.html: ItemList positions must be unique and contiguous",
    );
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Verified ${htmlFiles.length} HTML pages, ${sitemapUrls.size} sitemap URLs, JSON-LD, canonicals, metadata, headings, and internal links.`,
  );
}
