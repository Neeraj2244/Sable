import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

const read = () => (typeof window === "undefined" ? "" : window.location.hash.slice(1));

/** Current location hash without the leading "#", re-rendering on change. */
export const useHash = () => useSyncExternalStore(subscribe, read, read);
