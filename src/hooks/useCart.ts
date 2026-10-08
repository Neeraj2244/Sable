import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product, SiteContent } from "../content/types";
import { getJson, setJson } from "../lib/storage";

type Cart = Record<string, number>;

const CART_KEY = "sera-cart";
export const MAX_QTY = 20;

// Drop anything that no longer exists on the menu or isn't a sane quantity.
function readCart(products: readonly Product[]): Cart {
  const stored = getJson<Cart>(CART_KEY) ?? {};
  return Object.fromEntries(Object.entries(stored).filter(([id, qty]) => products.some((p) => p.id === id) && Number.isInteger(qty) && qty > 0 && qty <= MAX_QTY));
}

export function useCart(products: readonly Product[], delivery: SiteContent["delivery"]) {
  const [cart, setCart] = useState<Cart>(() => readCart(products));

  useEffect(() => setJson(CART_KEY, cart), [cart]);

  const change = useCallback((id: string, amount: number) => setCart(({ [id]: current = 0, ...rest }) => {
    const qty = Math.min(current + amount, MAX_QTY);
    return qty > 0 ? { ...rest, [id]: qty } : rest;
  }), []);

  return useMemo(() => {
    const lines = products.filter((p) => cart[p.id]).map((product) => ({ product, qty: cart[product.id] }));
    const count = lines.reduce((sum, line) => sum + line.qty, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
    const free = delivery.freeOver > 0 && subtotal >= delivery.freeOver;
    const shipping = free ? 0 : delivery.fee;
    const qtyOf = (id: string) => cart[id] ?? 0;
    return {
      lines, count, subtotal, free, shipping, total: subtotal + shipping, qtyOf,
      /** Adds one; returns false when the item is already at the limit. */
      add: (id: string) => qtyOf(id) < MAX_QTY && (change(id, 1), true),
      change,
      remove: (id: string) => change(id, -Infinity),
      clear: () => setCart({}),
    };
  }, [cart, products, delivery, change]);
}
