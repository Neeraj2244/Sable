// Web storage can throw (private mode, blocked cookies, quota). Every read and
// write in the app goes through here so a storage failure never breaks a page.

type Area = "local" | "session";

const area = (which: Area) => (which === "local" ? window.localStorage : window.sessionStorage);

export function getItem(key: string, which: Area = "local") {
  try { return area(which).getItem(key); } catch { return null; }
}

export function setItem(key: string, value: string | null, which: Area = "local") {
  try {
    if (value === null) area(which).removeItem(key);
    else area(which).setItem(key, value);
  } catch { /* value lives in memory only */ }
}

export function getJson<T>(key: string, which: Area = "local"): T | null {
  const raw = getItem(key, which);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export const setJson = (key: string, value: unknown, which: Area = "local") =>
  setItem(key, value === null || value === undefined ? null : JSON.stringify(value), which);
