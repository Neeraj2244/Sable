export const iconNames = ["arrow-right", "arrow-up-right", "arrow-left", "plus", "minus", "bag", "close", "menu", "star", "spark", "leaf", "clock", "snow", "globe", "shield", "chevron-down", "check", "lock", "truck", "heart", "coffee", "credit-card"] as const;
export type IconName = (typeof iconNames)[number];

export type Category = { id: string; name: string; description: string };

export type Product = {
  id: string;
  /** Category id; products with an unknown category land in an "Other" row. */
  category: string;
  name: string;
  label: string;
  description: string;
  size: string;
  price: number;
  image: string;
  imageAlt: string;
  /** CSS object-position, e.g. "70% center", to choose which part of the photo shows. */
  imagePosition?: string;
};

export type IconItem = { icon: IconName; title: string; text: string };
export type Testimonial = { quote: string; name: string; detail: string; initials: string };
export type Faq = { question: string; answer: string };
/** A delivery app the shop is listed on. `logo` is optional; without it the card shows the first letter. */
export type Platform = { name: string; tagline: string; url: string; logo?: string; color: string };

// Every piece of text, image and price on the site. Edited from #admin and
// committed back to src/content/content.json, which the site is built from.
// Multi-line titles use "\n" to mark where the desktop line break goes.
export type SiteContent = {
  brand: { name: string; contactEmail: string };
  nav: { products: string; menu: string; craft: string; stories: string; delivery: string };
  hero: { eyebrow: string; headline: string; copy: string; primaryCta: string; secondaryCta: string; captionLeft: string; captionRight: string; image: string; imageAlt: string };
  highlight: { label: string; quote: string; name: string; detail: string; initials: string };
  craft: { eyebrow: string; title: string; intro: string; steps: IconItem[] };
  menu: { eyebrow: string; title: string; intro: string; viewMore: string; footnote: string; footnoteLink: string; categories: Category[]; products: Product[] };
  shop: { eyebrow: string; title: string; intro: string; comingSoon: string };
  feature: { eyebrow: string; title: string; body: string; points: string[]; linkLabel: string; image: string; imageAlt: string; imageNote: string };
  benefits: { eyebrow: string; title: string; body: string; linkLabel: string; items: IconItem[] };
  stories: { eyebrow: string; title: string; intro: string; label: string; testimonials: Testimonial[] };
  delivery: { eyebrow: string; title: string; body: string; fee: number; freeOver: number; freeTitle: string; note: string };
  apps: { eyebrow: string; title: string; body: string; note: string; platforms: Platform[] };
  faq: { eyebrow: string; title: string; intro: string; linkLabel: string; items: Faq[] };
  closing: { eyebrow: string; title: string; body: string; cta: string };
  footer: { tagline: string; tableHeading: string; detailsHeading: string; contactHeading: string; contactText: string; bottomText: string };
  checkout: { eyebrow: string; title: string; intro: string; defaultCountry: string };
  success: { eyebrow: string; title: string; flourish: string };
};
