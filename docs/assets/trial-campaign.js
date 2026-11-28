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
  // The same feeds are available in many readers. Use a directory source only
  // when the browser reports a click from that directory's public site.
  const [source, medium, campaign] = explicitCampaign;
  const isIntuneFeed = source === "nizlo_intune_feed" && campaign === "intune_field_notes";
  const isResourceFeed = source === "nizlo_resource_feed" && Boolean(campaign);
  if (medium === "rss" && (isIntuneFeed || isResourceFeed)) {
    if (document.referrer.startsWith("https://rss.mobi/")) {
      values = ["rss_mobi", "referral", campaign];
    } else if (document.referrer.startsWith("https://rssamp.com/")) {
      values = ["rssamp", "referral", campaign];
    }
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
