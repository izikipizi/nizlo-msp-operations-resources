(() => {
  const referral = new URLSearchParams(window.location.search);
  const campaignFields = ["utm_source", "utm_medium", "utm_campaign"];
  const campaign = campaignFields.map((field) => [field, referral.get(field)?.trim()]);
  if (!campaign.every(([, value]) => value)) return;

  // Leave the destination's plan and link placement intact.
  for (const link of document.querySelectorAll("a[data-trial-campaign]")) {
    const destination = new URL(link.href);
    for (const [field, value] of campaign) {
      destination.searchParams.set(field, value);
    }
    link.href = destination.href;
  }
})();
