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
  // The same Intune feed is available in many readers. Use the directory
  // source only when the browser reports a click from its public site.
  if (
    explicitCampaign[0] === "nizlo_intune_feed" &&
    explicitCampaign[1] === "rss" &&
    explicitCampaign[2] === "intune_field_notes" &&
    document.referrer.startsWith("https://rss.mobi/")
  ) {
    values = ["rss_mobi", "referral", "intune_field_notes"];
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
