import { useEffect } from "react";
import { prefersReducedMotion } from "./useResize";

const PENDING = "[data-reveal]:not([data-revealed])";

/**
 * Fades in every [data-reveal] element as it scrolls into view, including
 * elements added later (new pages, new cards).
 *
 * The "shown" state is stored in a data-revealed attribute, never in
 * className: React owns className and rewrites it whenever it changes
 * (e.g. an FAQ item toggling "is-open"), which would wipe a class added here
 * and make the element vanish again.
 */
export function useReveal() {
  useEffect(() => {
    const reveal = (el: Element) => el.setAttribute("data-revealed", "");
    const instant = prefersReducedMotion() || !("IntersectionObserver" in window);

    const io = instant ? null : new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        io?.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });

    const track = (el: Element) => (io ? io.observe(el) : reveal(el));
    const scan = (root: Element | Document) => {
      if (root instanceof Element && root.matches(PENDING)) track(root);
      root.querySelectorAll(PENDING).forEach(track);
    };

    scan(document);
    const mo = new MutationObserver((records) => {
      for (const record of records) record.addedNodes.forEach((node) => node instanceof Element && scan(node));
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io?.disconnect();
      mo.disconnect();
    };
  }, []);
}
