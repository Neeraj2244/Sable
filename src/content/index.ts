import { getJson } from "../lib/storage";
import content from "./content.json";
import type { SiteContent } from "./types";

export const publishedContent = content as SiteContent;

export const DRAFT_STORAGE_KEY = "sable-admin-draft";
export const readDraft = () => getJson<SiteContent>(DRAFT_STORAGE_KEY);

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
