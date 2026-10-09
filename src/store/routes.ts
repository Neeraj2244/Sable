// URLs for the storefront.
//
// The Products page has a real path (/products/) so search engines index it as
// its own page; scripts/seo.mjs pre-renders it to dist/products/index.html.
// Home sections stay #anchors on the home page, and the checkout pages stay
// #hashes on whichever page you are on (they should not be indexed).
import type { StorePage } from "./StoreContext";

const BASE = import.meta.env.BASE_URL;
export const PRODUCTS_PATH = `${BASE}products/`;

export const homeUrl = (anchor = "") => `${BASE}${anchor ? `#${anchor}` : ""}`;
export const productsUrl = () => PRODUCTS_PATH;

/** True when the page was loaded at /products (with or without the trailing slash). */
export const isProductsPath = (pathname: string) => pathname.replace(/\/?$/, "/") === PRODUCTS_PATH;

const HASH_PAGES = new Set<string>(["payment", "success"]);

/** Which page to show for a path + hash. Anchors like #faq never change the page. */
export function pageFor(pathname: string, hash: string): StorePage {
  if (HASH_PAGES.has(hash)) return hash as StorePage;
  return isProductsPath(pathname) ? "products" : "home";
}

/**
 * Moves to a URL: a hash change when it is the same document (keeps the bag and
 * page state), otherwise a normal page load.
 */
export function navigate(url: string) {
  const target = new URL(url, window.location.href);
  if (target.pathname !== window.location.pathname) return window.location.assign(target.href);
  if (target.hash === window.location.hash) return;
  if (target.hash) return void (window.location.hash = target.hash);
  // Back to the page itself (no hash): drop the hash and tell listeners.
  history.pushState(null, "", target.pathname + target.search);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
