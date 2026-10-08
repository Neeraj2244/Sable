import { getJson } from "../lib/storage";
import content from "./content.json";
import type { SiteContent } from "./types";

export const publishedContent = content as SiteContent;

export const DRAFT_STORAGE_KEY = "sable-admin-draft";

/**
 * Fills anything missing from saved or imported content with the published
 * defaults, so a draft or backup made before a new field existed still works.
 */
export function normalizeContent(input: unknown): SiteContent {
  const source = (input && typeof input === "object" ? input : {}) as Partial<Record<keyof SiteContent, Record<string, unknown>>>;
  const result = {} as Record<string, unknown>;
  for (const key of Object.keys(publishedContent) as (keyof SiteContent)[]) {
    const section = source[key];
    result[key] = section && typeof section === "object" ? { ...publishedContent[key], ...section } : publishedContent[key];
  }
  const out = result as SiteContent;
  // Copy menu before touching it: it may still be the shared published object.
  out.menu = { ...out.menu, products: out.menu.products.map((product) => ({ ...product, category: product.category ?? "" })) };
  return out;
}

export const readDraft = () => {
  const draft = getJson<unknown>(DRAFT_STORAGE_KEY);
  return draft ? normalizeContent(draft) : null;
};

// Images live in public/ and are stored relative ("images/x.webp") so they work
// under the GitHub Pages sub-path. Full URLs are passed through untouched.
export function assetUrl(path: string) {
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatMoney = (amount: number) => rupees.format(amount);

export const pad2 = (n: number) => String(n).padStart(2, "0");
export const titleCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Only https links leave the site; anything else (javascript:, data:, typos) is dropped. */
export function safeLink(url: string) {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

/** Hex colours only, so content can never inject arbitrary CSS. */
export const safeColor = (color: string, fallback = "#38271e") => (/^#[0-9a-f]{3,8}$/i.test(color.trim()) ? color.trim() : fallback);
