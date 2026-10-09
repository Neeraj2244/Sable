// Google Analytics 4 and Meta Pixel, loaded only after the visitor agrees.
// IDs come from content.seo (admin → Search & sharing); with no IDs set,
// nothing here runs and no banner is shown.
import type { SiteContent } from "../content/types";
import { getJson, setJson } from "./storage";

type Ids = Pick<SiteContent["seo"], "ga4Id" | "metaPixelId">;
type Choice = { choice: "granted" | "denied"; at: string };

// Validated so a typo in the admin panel can never inject a script URL.
export const GA4_ID = /^G-[A-Z0-9]{4,15}$/;
export const PIXEL_ID = /^\d{6,20}$/;

const CONSENT_KEY = "sera-consent";
export const readConsent = () => getJson<Choice>(CONSENT_KEY)?.choice ?? null;
export const saveConsent = (choice: Choice["choice"]) => setJson(CONSENT_KEY, { choice, at: new Date().toISOString() } satisfies Choice);

export const analyticsConfigured = ({ ga4Id, metaPixelId }: Ids) => GA4_ID.test(ga4Id ?? "") || PIXEL_ID.test(metaPixelId ?? "");

type Win = Window & { _fbq?: unknown; dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; callMethod?: (...a: unknown[]) => void } };
const w = () => window as Win;

function addScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.append(script);
}

let started = false;

/** Loads the configured tags. Call only after consent. Safe to call twice. */
export function startAnalytics({ ga4Id, metaPixelId }: Ids) {
  if (started) return;
  started = true;
  const win = w();
  if (ga4Id && GA4_ID.test(ga4Id)) {
    win.dataLayer = win.dataLayer ?? [];
    // gtag must push the real `arguments` object, as Google's snippet does.
    win.gtag = function gtag() { win.dataLayer!.push(arguments); }; // eslint-disable-line prefer-rest-params
    win.gtag("js", new Date());
    win.gtag("config", ga4Id);
    addScript(`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`);
  }
  if (metaPixelId && PIXEL_ID.test(metaPixelId)) {
    // Meta's queueing stub, so calls made before fbevents.js loads are kept.
    type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string; push?: unknown };
    const fbq: Fbq = Object.assign((...args: unknown[]) => void (fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args)), { queue: [] as unknown[], loaded: true, version: "2.0" });
    fbq.push = fbq;
    win.fbq = fbq;
    win._fbq = fbq;
    fbq("init", metaPixelId);
    fbq("track", "PageView");
    addScript("https://connect.facebook.net/en_US/fbevents.js");
  }
}

/** Sends an event to whichever tags are running; does nothing without consent. */
export function track(event: "page_view" | "add_to_cart" | "begin_checkout", data: Record<string, unknown> = {}) {
  if (!started) return;
  const { gtag, fbq } = w();
  gtag?.("event", event, data);
  const meta = { add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", page_view: "PageView" }[event];
  fbq?.("track", meta, data);
}
