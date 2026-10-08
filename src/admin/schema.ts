import type { IconItem, Product, SiteContent } from "../content/types";

// Describes every editable field. To make a new piece of content editable,
// add it to SiteContent + content.json, then list it here; the editor UI,
// list add/remove/reorder and publishing all come for free.

type ScalarField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "image" | "icon" | "email" | "url" | "color" | "category";
  hint?: string;
  /** Character limit, enforced while typing and checked again before publishing. */
  max?: number;
};

export type ListField = {
  key: string;
  label: string;
  type: "list";
  singular: string;
  /** Omit for a plain list of strings. */
  item?: ScalarField[];
  itemTitle?: (item: Record<string, unknown>) => string;
  newItem: () => unknown;
};

export type Field = ScalarField | ListField;
export type Section = { id: keyof SiteContent; title: string; description: string; fields: Field[] };

const text = (key: string, label: string, hint?: string): ScalarField => ({ key, label, type: "text", hint });
const area = (key: string, label: string, hint?: string): ScalarField => ({ key, label, type: "textarea", hint });
const rupees = (key: string, label: string, hint?: string): ScalarField => ({ key, label, type: "number", hint });
const image = (key = "image", label = "Photo"): ScalarField[] => [{ key, label, type: "image" }, text(`${key}Alt`, "Photo description (for screen readers)")];

const BREAK_HINT = "Press Enter where the line should break on desktop.";
/** The small heading + big title pair most sections open with. */
const heading = (titleHint = BREAK_HINT) => [text("eyebrow", "Small heading"), area("title", "Title", titleHint)];

const list = (key: string, label: string, singular: string, item: ScalarField[] | undefined, newItem: () => unknown, itemTitle?: ListField["itemTitle"]): ListField =>
  ({ key, label, type: "list", singular, item, newItem, itemTitle });

const iconItems = (key: string, label: string, singular: string, icon: IconItem["icon"]) =>
  list(key, label, singular, [{ key: "icon", label: "Icon", type: "icon" }, text("title", "Title"), area("text", "Text")],
    () => ({ icon, title: "", text: "" }), (item) => String(item.title || `Untitled ${singular}`));

const newProduct = (): Product => ({ id: `p-${Date.now().toString(36)}`, category: "", name: "", label: "", description: "", size: "", price: 200, image: "images/classic-tiramisu.webp", imageAlt: "" });

export const sections: Section[] = [
  { id: "brand", title: "Brand & contact", description: "The name in the logo and the email used in every “get in touch” link.", fields: [
    text("name", "Brand name", "Shown in the logo and the large hero word."), { key: "contactEmail", label: "Contact email", type: "email" },
  ] },
  { id: "nav", title: "Navigation", description: "Labels for the top menu and footer links.", fields: [
    text("products", "Products tab"), text("menu", "Home menu link", "Used in the footer."), text("craft", "About link"), text("stories", "Reviews link"), text("delivery", "Delivery link"),
  ] },
  { id: "hero", title: "Hero", description: "The full-width photo section at the top of the page.", fields: [
    ...image("image", "Background photo"), text("eyebrow", "Small heading"), area("headline", "Headline", BREAK_HINT), area("copy", "Intro text"),
    text("primaryCta", "Main button"), text("secondaryCta", "Secondary link"), text("captionLeft", "Bottom caption, left"), text("captionRight", "Bottom caption, right"),
  ] },
  { id: "highlight", title: "Highlight quote", description: "The single review in the strip under the hero.", fields: [
    text("label", "Label"), area("quote", "Quote"), text("name", "Name"), text("detail", "Detail"), text("initials", "Initials"),
  ] },
  { id: "craft", title: "How it’s made", description: "The numbered three-column section.", fields: [
    ...heading(), area("intro", "Intro text"), iconItems("steps", "Steps", "step", "spark"),
  ] },
  { id: "menu", title: "Products", description: "Everything on the menu: names, prices, photos.", fields: [
    ...heading(), area("intro", "Intro text"),
    text("viewMore", "“View more” button", "Shown under the home page products and opens the Products page. The home page shows the first 4 products."),
    list("categories", "Categories", "category", [text("name", "Name"), area("description", "Description")],
      () => ({ id: `c-${Date.now().toString(36)}`, name: "", description: "" }), (item) => String(item.name || "Untitled category")),
    list("products", "Products", "product", [
      { key: "category", label: "Category", type: "category", hint: "Products without a category appear in a “More from our kitchen” row." },
      ...image(), text("imagePosition", "Photo focus", "Optional, e.g. “70% center” to shift which part of the photo shows."),
      text("name", "Name"), rupees("price", "Price"), text("label", "Ribbon label", "Leave empty to hide the ribbon."), text("size", "Size"),
      { ...area("description", "Description", "Cards show the first 2 lines; longer text gets a Read more link."), max: 100 },
    ], newProduct, (item) => `${item.name || "Untitled product"} · ₹${item.price ?? 0}`),
    text("footnote", "Note under the products"), text("footnoteLink", "Note link"),
  ] },
  { id: "shop", title: "Products page", description: "The page behind the Products tab: every product, grouped by category in sideways-scrolling rows.", fields: [
    ...heading(), area("intro", "Intro text"), text("comingSoon", "Message for an empty category"),
  ] },
  { id: "feature", title: "Feature", description: "The half-photo, half-text section.", fields: [
    ...image(), text("imageNote", "Caption on photo"), ...heading(), area("body", "Text"),
    list("points", "Ticked points", "point", undefined, () => ""), text("linkLabel", "Link"),
  ] },
  { id: "benefits", title: "Benefits", description: "The list of reasons with icons.", fields: [
    ...heading("Press Enter for a line break."), area("body", "Text"), text("linkLabel", "Link"), iconItems("items", "Benefits", "benefit", "heart"),
  ] },
  { id: "stories", title: "Reviews", description: "The rotating customer quotes. Remove them all to hide the section.", fields: [
    ...heading(), text("intro", "Intro text"), text("label", "Label beside the stars"),
    list("testimonials", "Reviews", "review", [area("quote", "Quote"), text("name", "Name"), text("detail", "Detail"), text("initials", "Initials")],
      () => ({ quote: "", name: "", detail: "", initials: "" }), (item) => String(item.name || "Unnamed review")),
  ] },
  { id: "delivery", title: "Delivery", description: "The delivery fee charged at checkout and the delivery section.", fields: [
    rupees("fee", "Flat delivery fee"), rupees("freeOver", "Free delivery from", "Set to 0 to always charge the flat fee."),
    text("freeTitle", "Free delivery heading", "Only shown when free delivery is on."), ...heading(), area("body", "Text"), text("note", "Note under the price"),
  ] },
  { id: "faq", title: "FAQ", description: "Questions and answers.", fields: [
    ...heading(), area("intro", "Intro text"), text("linkLabel", "Email link"),
    list("items", "Questions", "question", [text("question", "Question"), area("answer", "Answer")],
      () => ({ question: "", answer: "" }), (item) => String(item.question || "Untitled question")),
  ] },
  { id: "apps", title: "Zomato & Swiggy", description: "The “order on delivery apps” cards near the bottom of the page. Add Magicpin, EatSure and so on as more platforms.", fields: [
    ...heading(), area("body", "Text"), text("note", "Small print under the cards"),
    list("platforms", "Platforms", "platform", [
      text("name", "Name"), text("tagline", "Tagline"),
      { key: "logo", label: "Logo", type: "image", hint: "A square app icon works best. Leave empty to show the first letter instead." },
      { key: "url", label: "Your restaurant page on the app", type: "url", hint: "Must start with https://. Without a valid link the card shows “Search on …” instead." },
      { key: "color", label: "Brand colour", type: "color" },
    ], () => ({ name: "", tagline: "", url: "", color: "#38271e" }), (item) => String(item.name || "Untitled platform")),
  ] },
  { id: "closing", title: "Closing banner", description: "The last call-to-action before the footer.", fields: [
    ...heading(), text("body", "Text"), text("cta", "Button"),
  ] },
  { id: "footer", title: "Footer", description: "Text at the very bottom of the page.", fields: [
    area("tagline", "Tagline", "Press Enter for a line break."), text("tableHeading", "First column heading"), text("detailsHeading", "Second column heading"),
    text("contactHeading", "Third column heading"), text("contactText", "Third column text"), text("bottomText", "Bottom line"),
  ] },
  { id: "checkout", title: "Checkout", description: "Text on the delivery and payment page.", fields: [
    text("eyebrow", "Small heading"), text("title", "Title"), area("intro", "Intro text"), text("defaultCountry", "Default country"),
  ] },
  { id: "success", title: "Order confirmation", description: "The thank-you page after checkout.", fields: [
    text("eyebrow", "Small heading"), text("title", "Title"), text("flourish", "Sign-off"),
  ] },
];

export type LimitError = { section: string; field: string; item?: string; length: number; max: number };

/** Every text value in the draft that is longer than its field allows. */
export function findLimitErrors(content: SiteContent): LimitError[] {
  const errors: LimitError[] = [];
  const check = (field: ScalarField, value: unknown, section: string, item?: string) => {
    if (field.max && typeof value === "string" && value.length > field.max) errors.push({ section, field: field.label, item, length: value.length, max: field.max });
  };
  for (const section of sections) {
    const values = content[section.id] as Record<string, unknown>;
    for (const field of section.fields) {
      if (field.type !== "list") { check(field, values[field.key], section.title); continue; }
      const items = Array.isArray(values[field.key]) ? (values[field.key] as Record<string, unknown>[]) : [];
      items.forEach((item, i) => field.item?.forEach((sub) => check(sub, item[sub.key], section.title, field.itemTitle?.(item) ?? `${field.singular} ${i + 1}`)));
    }
  }
  return errors;
}
