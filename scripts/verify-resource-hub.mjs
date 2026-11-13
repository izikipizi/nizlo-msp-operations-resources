import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = join(repositoryRoot, "docs");
const siteOrigin = "https://izikipizi.github.io/nizlo-msp-operations-resources/";

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

function localUrlFor(path) {
  const relativePath = relative(docsRoot, path).replaceAll("\\", "/");
  if (relativePath === "index.html") return siteOrigin;
  if (relativePath.endsWith("/index.html")) {
    return `${siteOrigin}${relativePath.slice(0, -"index.html".length)}`;
  }
  return `${siteOrigin}${relativePath}`;
}

const allFiles = await listFiles(docsRoot);
const htmlFiles = allFiles.filter((path) => path.endsWith(".html"));
const sitemap = await readFile(join(docsRoot, "sitemap.xml"), "utf8");
const sitemapUrls = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
);

const errors = [];

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
      throw new Error(`${relativePath}: meta description length is ${description.length}`);
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
    if (h1Count !== 1) throw new Error(`${relativePath}: expected one h1, found ${h1Count}`);

    const jsonLdBlocks = [
      ...source.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    ];
    if (jsonLdBlocks.length === 0) throw new Error(`${relativePath}: missing JSON-LD`);
    for (const [, json] of jsonLdBlocks) JSON.parse(json);

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
  ...homepage.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g),
].map((match) => JSON.parse(match[1]));
const collectionPage = homepageJsonLd.find((entry) => entry["@type"] === "CollectionPage");
if (!collectionPage) errors.push("docs/index.html: missing CollectionPage JSON-LD");
else {
  const itemList = collectionPage.mainEntity;
  const items = itemList?.itemListElement ?? [];
  const positions = items.map((item) => Number(item.position));
  const expectedPositions = Array.from({ length: items.length }, (_, index) => index + 1);
  if (itemList.numberOfItems !== items.length) {
    errors.push(
      `docs/index.html: numberOfItems is ${itemList.numberOfItems}, but ${items.length} items exist`,
    );
  }
  if (JSON.stringify([...positions].sort((a, b) => a - b)) !== JSON.stringify(expectedPositions)) {
    errors.push("docs/index.html: ItemList positions must be unique and contiguous");
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
