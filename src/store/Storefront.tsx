import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import type { SiteContent } from "../content/types";
import { useCart } from "../hooks/useCart";
import { useHash } from "../hooks/useHash";
import { useReveal } from "../hooks/useReveal";
import { BagDrawer } from "./BagDrawer";
import { CheckoutPage, SuccessPage } from "./CheckoutPages";
import { HomePage } from "./HomePage";
import { StoreContext, type Store, type StorePage } from "./StoreContext";

const toPage = (hash: string): StorePage => (hash === "payment" || hash === "success" ? hash : "home");

export default function Storefront({ content }: { content: SiteContent }) {
  const page = toPage(useHash());
  const cart = useCart(content.menu.products, content.delivery);
  const [bagOpen, setBagOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [orderEmail, setOrderEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const reopenBag = useRef(false);
  const toastTimer = useRef<number>(undefined);

  useReveal(page);

  useEffect(() => {
    setBagOpen(page === "home" && reopenBag.current);
    reopenBag.current = false;
    if (page !== "home") window.scrollTo({ top: 0 });
  }, [page]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const goTo = (next: StorePage) => {
    const hash = next === "home" ? "#menu" : `#${next}`;
    if (window.location.hash !== hash) return void (window.location.hash = hash);
    setBagOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const store: Store = {
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
      cart.add(id);
      setToast(`${content.menu.products.find((p) => p.id === id)?.name ?? "Tiramisu"} added to your bag.`);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(""), 2600);
    },
  };

  const placeOrder = (email: string) => {
    setOrderEmail(email);
    setOrderNumber(`SERA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
    cart.clear();
    goTo("success");
  };

  return (
    <StoreContext.Provider value={store}>
      <div className="site-shell">
        {page === "home" && <HomePage />}
        {page === "payment" && <CheckoutPage onSubmit={placeOrder} />}
        {page === "success" && <SuccessPage email={orderEmail} orderNumber={orderNumber} />}
        <BagDrawer open={bagOpen} onClose={() => setBagOpen(false)} />
        {toast && <div className="toast-message" role="status" aria-live="polite"><span className="toast-icon"><Icon name="check" size={14} /></span>{toast}<button type="button" aria-label="Dismiss notification" onClick={() => setToast("")}><Icon name="close" size={14} /></button></div>}
      </div>
    </StoreContext.Provider>
  );
}
