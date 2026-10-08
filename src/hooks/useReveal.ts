import { useEffect } from "react";

/** Fades in every [data-reveal] element as it scrolls into view. Re-scans when `key` changes. */
export function useReveal(key: unknown) {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)");
    const show = (element: Element) => element.classList.add("is-visible");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      elements.forEach(show);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        show(entry.target);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [key]);
}
