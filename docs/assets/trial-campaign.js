(() => {
  const referral = new URLSearchParams(window.location.search);
  const campaignFields = ["utm_source", "utm_medium", "utm_campaign"];
  const explicitCampaign = campaignFields.map((field) => referral.get(field)?.trim());
  let values = explicitCampaign;

  // The directory uses a clean outbound URL. Attribute it only when the
  // browser reports its origin and this resource opts into that placement.
  const appleBookmarksOrigin = "https://cbookmarks.github.io/";
  if (
    campaignFields.every((field) => !referral.has(field)) &&
    document.documentElement.dataset.referralPlacement === "apple-community-bookmarks" &&
    document.referrer.startsWith(appleBookmarksOrigin)
  ) {
    values = ["apple_community_bookmarks", "referral", "macos_rmm_pilot_matrix"];
  }
  // Identify the directory only when the browser reports its origin.
  const feedSource = [
    ["https://rss.mobi/", "rss_mobi"],
    ["https://rssamp.com/", "rssamp"],
  ].find(([origin]) => document.referrer.startsWith(origin))?.[1];
  const [source, medium, campaign] = explicitCampaign;
  const isIntuneFeed = source === "nizlo_intune_feed" && campaign === "intune_field_notes";
  const isResourceFeed = source === "nizlo_resource_feed" && Boolean(campaign);
  const cleanFeedCampaign = document.documentElement.dataset.resourceFeedCampaign;

  if (feedSource && medium === "rss" && (isIntuneFeed || isResourceFeed)) {
    values = [feedSource, "referral", campaign];
  } else if (
    feedSource &&
    cleanFeedCampaign &&
    campaignFields.every((field) => !referral.has(field))
  ) {
    values = [feedSource, "referral", cleanFeedCampaign];
  }
  if (!values.every(Boolean)) return;

  // Leave the destination's plan and link placement intact.
  for (const link of document.querySelectorAll("a[data-trial-campaign]")) {
    const destination = new URL(link.href);
    for (const [index, field] of campaignFields.entries()) {
      destination.searchParams.set(field, values[index]);
    }
    link.href = destination.href;
  }
})();
