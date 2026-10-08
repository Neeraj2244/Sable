import { useEffect, type DependencyList, type RefObject } from "react";

/** Calls `onResize` now and whenever the element changes size (window resize where ResizeObserver is missing). */
export function useResize(ref: RefObject<Element | null>, onResize: () => void, deps: DependencyList) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    onResize();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    const observer = new ResizeObserver(onResize);
    observer.observe(el);
    return () => observer.disconnect();
  }, deps);
}

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
