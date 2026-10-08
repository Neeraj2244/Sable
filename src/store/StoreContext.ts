import { createContext, useContext } from "react";
import type { SiteContent } from "../content/types";
import type { useCart } from "../hooks/useCart";

export type StorePage = "home" | "products" | "payment" | "success";

export type Store = {
  content: SiteContent;
  cart: ReturnType<typeof useCart>;
  addToBag: (id: string) => void;
  openBag: () => void;
  returnToBag: () => void;
  goTo: (page: StorePage) => void;
};

export const StoreContext = createContext<Store | null>(null);

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <Storefront>");
  return store;
}
