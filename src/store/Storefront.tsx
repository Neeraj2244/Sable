import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import type { SiteContent } from "../content/types";
import { MAX_QTY, useCart } from "../hooks/useCart";
import { useHash } from "../hooks/useHash";
import { useReveal } from "../hooks/useReveal";
import { BagDrawer } from "./BagDrawer";
import { CheckoutPage, SuccessPage } from "./CheckoutPages";
import { HomePage } from "./HomePage";
import { ProductsPage } from "./ProductsPage";
import { StoreContext, type Store, type StorePage } from "./StoreContext";

// Hashes that are whole pages; any other hash is an anchor on the home page.
const PAGES = new Set<string>(["products", "payment", "success"]);
const toPage = (hash: string) => (PAGES.has(hash) ? hash : "home") as StorePage;

// randomUUID needs a recent browser and a secure context; fall back for the rest.
const orderId = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/-/g, "").slice(0, 8).toUpperCase();

export default function Storefront({ content }: { content: SiteContent }) {
  const [order, setOrder] = useState<{ number: string; email: string } | null>(null);
  const requested = toPage(useHash());
  // The confirmation page only exists for an order placed in this visit.
  const page = requested === "success" && !order ? "home" : requested;

  const cart = useCart(content.menu.products, content.delivery);
  const [bagOpen, setBagOpen] = useState(false);
  const [toast, setToast] = useState("");
  const reopenBag = useRef(false);
  const toastTimer = useRef<number>(undefined);

  useReveal();

  useEffect(() => {
    setBagOpen(page === "home" && reopenBag.current);
    reopenBag.current = false;
    // Arriving on home from another page with an anchor (e.g. #delivery): the
    // section did not exist when the browser tried to jump, so jump now.
    const anchor = page === "home" && window.location.hash.length > 1 ? document.getElementById(window.location.hash.slice(1)) : null;
    if (anchor) anchor.scrollIntoView();
    else window.scrollTo({ top: 0 });
  }, [page]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = useCallback((text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  const goTo = useCallback((next: StorePage) => {
    const target = next === "home" ? "#menu" : `#${next}`;
    if (window.location.hash !== target) return void (window.location.hash = target);
    setBagOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const store = useMemo<Store>(() => ({
    content,
    cart,
    goTo,
    openBag: () => setBagOpen(true),
    returnToBag: () => {
      if (page === "home") return setBagOpen(true);
      reopenBag.current = true;
      goTo("home");
    },
    addToBag: (id) => {
      const name = content.menu.products.find((p) => p.id === id)?.name ?? "Tiramisu";
      showToast(cart.add(id) ? `${name} added to your bag.` : `You can add up to ${MAX_QTY} of ${name} per order.`);
    },
  }), [content, cart, goTo, page, showToast]);

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
