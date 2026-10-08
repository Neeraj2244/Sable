import type { IconItem, Product, SiteContent } from "../content/types";

// Describes every editable field. To make a new piece of content editable,
// add it to SiteContent + content.json, then list it here; the editor UI,
// list add/remove/reorder and publishing all come for free.

type ScalarField = { key: string; label: string; type: "text" | "textarea" | "number" | "image" | "icon" | "email"; hint?: string };

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

const newProduct = (): Product => ({ id: `p-${Date.now().toString(36)}`, name: "", label: "", description: "", size: "", price: 200, image: "images/classic-tiramisu.webp", imageAlt: "" });

export const sections: Section[] = [
  { id: "brand", title: "Brand & contact", description: "The name in the logo and the email used in every “get in touch” link.", fields: [
    text("name", "Brand name", "Shown in the logo and the large hero word."), { key: "contactEmail", label: "Contact email", type: "email" },
  ] },
  { id: "nav", title: "Navigation", description: "Labels for the top menu. The footer reuses the first three.", fields: [
    text("menu", "Menu link"), text("craft", "About link"), text("stories", "Reviews link"), text("delivery", "Delivery link"),
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
    list("products", "Products", "product", [
      ...image(), text("imagePosition", "Photo focus", "Optional, e.g. “70% center” to shift which part of the photo shows."),
      text("name", "Name"), rupees("price", "Price"), text("label", "Ribbon label", "Leave empty to hide the ribbon."), text("size", "Size"), area("description", "Description"),
    ], newProduct, (item) => `${item.name || "Untitled product"} · ₹${item.price ?? 0}`),
    text("footnote", "Note under the products"), text("footnoteLink", "Note link"),
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
