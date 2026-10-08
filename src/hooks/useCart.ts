import { useEffect, useMemo, useState } from "react";
import type { Product, SiteContent } from "../content/types";
import { getJson, setJson } from "../lib/storage";

export type Cart = Record<string, number>;

const CART_KEY = "sera-cart";

// Drop anything that no longer exists on the menu or isn't a sane quantity.
function readCart(products: readonly Product[]): Cart {
  const stored = getJson<Cart>(CART_KEY) ?? {};
  return Object.fromEntries(Object.entries(stored).filter(([id, qty]) => products.some((p) => p.id === id) && Number.isInteger(qty) && qty > 0));
}

export function useCart(products: readonly Product[], delivery: SiteContent["delivery"]) {
  const [cart, setCart] = useState<Cart>(() => readCart(products));

  useEffect(() => setJson(CART_KEY, cart), [cart]);

  const change = (id: string, amount: number) => setCart(({ [id]: current = 0, ...rest }) => {
    const qty = current + amount;
    return qty > 0 ? { ...rest, [id]: qty } : rest;
  });

  const totals = useMemo(() => {
    const lines = products.filter((p) => cart[p.id]).map((product) => ({ product, qty: cart[product.id] }));
    const count = lines.reduce((sum, line) => sum + line.qty, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
    const free = delivery.freeOver > 0 && subtotal >= delivery.freeOver;
    const shipping = free ? 0 : delivery.fee;
    return { lines, count, subtotal, free, shipping, total: subtotal + shipping };
  }, [cart, products, delivery]);

  return {
    ...totals,
    qtyOf: (id: string) => cart[id] ?? 0,
    add: (id: string) => change(id, 1),
    change,
    remove: (id: string) => change(id, -Infinity),
    clear: () => setCart({}),
  };
}
