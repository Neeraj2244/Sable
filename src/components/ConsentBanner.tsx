import { useEffect, useState } from "react";
import type { SiteContent } from "../content/types";
import { analyticsConfigured, readConsent, saveConsent, startAnalytics } from "../lib/analytics";

export const OPEN_CONSENT_EVENT = "sera:open-consent";

/**
 * Asks before any analytics or ad tracking loads. Accept and Decline carry the
 * same weight, nothing is pre-selected, and the choice can be changed any time
 * from "Cookie settings" in the footer. Renders nothing when no IDs are set.
 */
export function ConsentBanner({ seo }: { seo: SiteContent["seo"] }) {
  const enabled = analyticsConfigured(seo);
  const [open, setOpen] = useState(() => enabled && readConsent() === null);

  useEffect(() => {
    if (enabled && readConsent() === "granted") startAnalytics(seo);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, [enabled, seo]);

  if (!enabled || !open) return null;

  const tools = [seo.ga4Id && "Google Analytics", seo.metaPixelId && "Meta Pixel"].filter(Boolean).join(" and ");
  const choose = (choice: "granted" | "denied") => {
    const before = readConsent();
    saveConsent(choice);
    setOpen(false);
    if (choice === "granted") startAnalytics(seo);
    // Tags already running can only be stopped by reloading without them.
    else if (before === "granted") window.location.reload();
  };

  return (
    <section className="consent" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-text">
      <h2 id="consent-title">Can we measure your visit?</h2>
      <p id="consent-text">
        With your permission we use {tools} to see how visitors find and use this site and to measure our ads.
        They set cookies and share usage data, such as pages viewed and items added to the bag, with Google and Meta.
        Your bag works the same either way. You can change this any time under “Cookie settings” at the bottom of the page.
      </p>
      <div className="consent-actions">
        <button type="button" className="consent-button" onClick={() => choose("denied")}>Decline</button>
        <button type="button" className="consent-button" onClick={() => choose("granted")}>Accept</button>
      </div>
    </section>
  );
}
