// Runs after `vite build`. Makes the built site readable to search engines,
// link previews and ad platforms without JavaScript:
//   1. pre-renders the home and Products pages into static HTML
//   2. gives each its own title, description, canonical URL, Open Graph /
//      Twitter tags and schema.org data (plus Search Console verification)
//   3. writes robots.txt, sitemap.xml, 404.html and _headers (security headers
//      for hosts such as Netlify and Cloudflare Pages that read that file)
// Everything comes from src/content/content.json, so admin edits flow through
// on the next deploy.
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "vite";

const dist = new URL("../dist/", import.meta.url);
const content = JSON.parse(await readFile(new URL("../src/content/content.json", import.meta.url), "utf8"));
const siteUrl = new URL(process.env.VITE_SITE_URL || "http://localhost:4173/").href.replace(/\/?$/, "/");
const base = new URL(siteUrl).pathname;
const abs = (path) => (/^https?:/.test(path) ? path : new URL(path.replace(/^\/+/, ""), siteUrl).href);
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const brand = `${content.brand.name.charAt(0).toUpperCase()}${content.brand.name.slice(1)} Tiramisu`;
const { seo } = content;
const image = abs(seo.shareImage || content.hero.image);

// The pages search engines should index. Checkout and admin live on #hashes and are not listed.
const pages = [
  { file: "index.html", path: base, url: siteUrl, title: seo.title, description: seo.description, faq: true },
  {
    file: "products/index.html", path: `${base}products/`, url: `${siteUrl}products/`,
    title: `${content.nav.products} | ${brand}`,
    description: content.shop.intro.length > 50 ? content.shop.intro : seo.description,
  },
];

// 1. Pre-render with the same config (and base path) as the build.
const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const { renderToString } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { default: Storefront } = await vite.ssrLoadModule("/src/store/Storefront.tsx");
  const { normalizeContent } = await vite.ssrLoadModule("/src/content/index.ts");
  for (const page of pages) {
    // Inline style attributes (animation delays, brand colours) are blocked by
    // the site's CSP when they come from HTML; React re-applies them safely.
    page.html = renderToString(createElement(Storefront, { content: normalizeContent(content), path: page.path })).replace(/ style="[^"]*"/g, "");
  }
} finally {
  await vite.close();
}

// 2. Structured data. A real Zomato/Swiggy listing counts as "sameAs"; a bare homepage does not.
const listings = content.apps.platforms.map((p) => p.url).filter((url) => { try { return new URL(url).pathname.length > 1; } catch { return false; } });
const business = {
  "@type": "Bakery",
  "@id": `${siteUrl}#business`,
  name: brand,
  url: siteUrl,
  image,
  description: seo.description,
  email: content.brand.contactEmail,
  servesCuisine: "Italian",
  priceRange: "₹",
  ...(seo.phone && { telephone: seo.phone }),
  ...(seo.city && { address: { "@type": "PostalAddress", addressLocality: seo.city, addressCountry: "IN" } }),
  ...(listings.length && { sameAs: listings }),
};
const products = content.menu.products.map((p) => ({
  "@type": "Product",
  name: p.name,
  description: p.description,
  image: abs(p.image),
  brand: { "@id": business["@id"] },
  offers: { "@type": "Offer", price: p.price, priceCurrency: "INR", availability: "https://schema.org/InStock", url: pages[1].url, seller: { "@id": business["@id"] } },
}));
const faq = { "@type": "FAQPage", mainEntity: content.faq.items.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) };
const website = { "@type": "WebSite", name: brand, url: siteUrl, inLanguage: "en-IN" };
// FAQ markup only where the FAQ is visible. "<" escaped so content can never close the script tag.
const jsonLd = (page) => JSON.stringify({ "@context": "https://schema.org", "@graph": [website, business, ...products, ...(page.faq ? [faq] : [])] }).replace(/</g, "\\u003c");

const headTags = (page) => [
  `<link rel="canonical" href="${esc(page.url)}" />`,
  seo.googleVerification && /^[\w-]{10,100}$/.test(seo.googleVerification) && `<meta name="google-site-verification" content="${esc(seo.googleVerification)}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:site_name" content="${esc(brand)}" />`,
  `<meta property="og:locale" content="en_IN" />`,
  `<meta property="og:url" content="${esc(page.url)}" />`,
  `<meta property="og:title" content="${esc(page.title)}" />`,
  `<meta property="og:description" content="${esc(page.description)}" />`,
  `<meta property="og:image" content="${esc(image)}" />`,
  `<meta property="og:image:alt" content="${esc(content.hero.imageAlt)}" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${esc(page.title)}" />`,
  `<meta name="twitter:description" content="${esc(page.description)}" />`,
  `<meta name="twitter:image" content="${esc(image)}" />`,
  `<script type="application/ld+json">${jsonLd(page)}</script>`,
].filter(Boolean).join("\n    ");

const replaceOnce = (html, pattern, value, label) => {
  if (!pattern.test(html)) throw new Error(`seo.mjs: could not find ${label} in dist/index.html`);
  return html.replace(pattern, value);
};

const template = await readFile(new URL("index.html", dist), "utf8");
for (const page of pages) {
  let html = template;
  html = replaceOnce(html, /<html lang="[^"]*">/, `<html lang="en-IN">`, "<html>");
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`, "<title>");
  html = replaceOnce(html, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(page.description)}" />`, "description");
  html = replaceOnce(html, /<\/head>/, `    ${headTags(page)}\n  </head>`, "</head>");
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${page.html}</div>`, "#root");
  const out = new URL(page.file, dist);
  await mkdir(new URL(".", out), { recursive: true });
  await writeFile(out, html);
}

// 3. Files for crawlers and hosts. robots.txt is only read at the root of a
// domain, so it takes effect on a custom domain; the sitemap can be submitted
// in Google Search Console either way.
const today = new Date().toISOString().slice(0, 10);
const csp = template.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/)?.[1]?.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
if (!csp) throw new Error("seo.mjs: Content-Security-Policy meta tag missing from the build");
await Promise.all([
  writeFile(new URL("robots.txt", dist), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`),
  writeFile(new URL("sitemap.xml", dist), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${esc(p.url)}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`),
  // Real response headers on hosts that support _headers (Netlify, Cloudflare Pages).
  // GitHub Pages ignores this file; there the <meta> CSP and the admin frame guard apply.
  writeFile(new URL("_headers", dist), `/*
  Content-Security-Policy: ${csp}; frame-ancestors 'self'
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
`),
]);
// A mistyped path still opens the site instead of a host error page.
await copyFile(new URL("index.html", dist), new URL("404.html", dist));

console.log(`seo: pre-rendered ${pages.map((p) => `${p.path} (${p.html.length.toLocaleString()} chars)`).join(", ")}; ${products.length} products, ${content.faq.items.length} FAQs → ${siteUrl}`);
