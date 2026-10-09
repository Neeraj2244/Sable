import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConsentBanner } from "../components/ConsentBanner";
import { Icon } from "../components/Icon";
import { track } from "../lib/analytics";
import type { SiteContent } from "../content/types";
import { MAX_QTY, useCart } from "../hooks/useCart";
import { useHash } from "../hooks/useHash";
import { useReveal } from "../hooks/useReveal";
import { BagDrawer } from "./BagDrawer";
import { CheckoutPage, SuccessPage } from "./CheckoutPages";
import { HomePage } from "./HomePage";
import { ProductsPage } from "./ProductsPage";
import { homeUrl, isProductsPath, navigate, pageFor, productsUrl } from "./routes";
import { StoreContext, type Store, type StorePage } from "./StoreContext";

// randomUUID needs a recent browser and a secure context; fall back for the rest.
const orderId = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/-/g, "").slice(0, 8).toUpperCase();

/** `path` lets the build pre-render a specific page; in the browser the real URL is used. */
export default function Storefront({ content, path }: { content: SiteContent; path?: string }) {
  const [order, setOrder] = useState<{ number: string; email: string } | null>(null);
  const pathname = path ?? (typeof window === "undefined" ? "/" : window.location.pathname);
  const basePage: StorePage = isProductsPath(pathname) ? "products" : "home";
  const hash = useHash();
  const requested = pageFor(pathname, hash);
  // The confirmation page only exists for an order placed in this visit.
  const page = requested === "success" && !order ? basePage : requested;

  const cart = useCart(content.menu.products, content.delivery);
  const [bagOpen, setBagOpen] = useState(false);
  const [toast, setToast] = useState("");
  const reopenBag = useRef(false);
  const toastTimer = useRef<number>(undefined);

  useReveal();

  // Page views for in-page changes (GA4 and Meta record the first load themselves).
  const firstPage = useRef(true);
  useEffect(() => {
    if (firstPage.current) return void (firstPage.current = false);
    track("page_view", { page_location: window.location.href, page_title: document.title });
  }, [page]);

  // Links shared before the Products page had its own address (#products) still work.
  useEffect(() => { if (hash === "products") window.location.replace(productsUrl()); }, [hash]);

  useEffect(() => {
    setBagOpen(page === basePage && reopenBag.current);
    reopenBag.current = false;
    // Arriving on home from another page with an anchor (e.g. #delivery): the
    // section did not exist when the browser tried to jump, so jump now.
    const anchor = page === "home" && window.location.hash.length > 1 ? document.getElementById(window.location.hash.slice(1)) : null;
    if (anchor) anchor.scrollIntoView();
    else window.scrollTo({ top: 0 });
  }, [page, basePage]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = useCallback((text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  const goTo = useCallback((next: StorePage) => {
    const target = new URL(next === "home" ? homeUrl("menu") : next === "products" ? productsUrl() : `#${next}`, window.location.href);
    if (next === "payment") track("begin_checkout", { currency: "INR", value: cart.total });
    if (target.href !== window.location.href) return navigate(target.href);
    setBagOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [cart.total]);

  const store = useMemo<Store>(() => ({
    page,
    content,
    cart,
    goTo,
    openBag: () => setBagOpen(true),
    returnToBag: () => {
      if (page === basePage) return setBagOpen(true);
      reopenBag.current = true;
      navigate(basePage === "products" ? productsUrl() : homeUrl("menu"));
    },
    addToBag: (id) => {
      const product = content.menu.products.find((p) => p.id === id);
      const name = product?.name ?? "Tiramisu";
      const added = cart.add(id);
      if (added && product) track("add_to_cart", { currency: "INR", value: product.price, items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: 1 }] });
      showToast(added ? `${name} added to your bag.` : `You can add up to ${MAX_QTY} of ${name} per order.`);
    },
  }), [content, cart, goTo, page, basePage, showToast]);

  const placeOrder = (email: string) => {
    setOrder({ number: `SERA-${orderId()}`, email });
    cart.clear();
    goTo("success");
  };

  return (
    <StoreContext.Provider value={store}>
      <div className="site-shell">
        {page === "home" && <HomePage />}
        {page === "products" && <ProductsPage />}
        {page === "payment" && <CheckoutPage onSubmit={placeOrder} />}
        {page === "success" && order && <SuccessPage email={order.email} orderNumber={order.number} />}
        <BagDrawer open={bagOpen} onClose={() => setBagOpen(false)} />
        <Toast text={toast} onDismiss={() => setToast("")} />
        <ConsentBanner seo={content.seo} />
      </div>
    </StoreContext.Provider>
  );
}

/** The live region is always mounted, so screen readers announce each new message. */
function Toast({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  return (
    <div className="toast-region" role="status">
      {text && (
        <div className="toast-message">
          <span className="toast-icon"><Icon name="check" size={14} /></span>{text}
          <button type="button" aria-label="Dismiss notification" onClick={onDismiss}><Icon name="close" size={14} /></button>
        </div>
      )}
    </div>
  );
}
