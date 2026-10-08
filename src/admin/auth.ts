// Client-side gate for the admin panel. The bundle only carries a salted
// PBKDF2 hash of "email\npassword", produced at build time from GitHub Actions
// secrets, so neither value appears in the repo or the shipped JS.
//
// This check only hides the editor. What actually protects the live site is
// the GitHub token needed to publish: without one, nothing can be changed.
import { getItem, setItem } from "../lib/storage";

const SESSION_KEY = "sable-admin-session";
const { VITE_ADMIN_SALT: salt = "", VITE_ADMIN_HASH: expected = "", VITE_ADMIN_ITERATIONS } = import.meta.env;
const iterations = Number(VITE_ADMIN_ITERATIONS ?? 600000);

export const authConfigured = Boolean(salt && expected);

const toHex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => new Uint8Array(hex.match(/.{2}/g)?.map((pair) => parseInt(pair, 16)) ?? []);

async function hashCredentials(email: string, password: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`${email.trim().toLowerCase()}\n${password}`), "PBKDF2", false, ["deriveBits"]);
  return toHex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromHex(salt), iterations }, key, 256));
}

// Constant-time compare so response timing doesn't leak how much matched.
const safeEqual = (a: string, b: string) => a.length === b.length && [...a].reduce((diff, ch, i) => diff | (ch.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

export async function signIn(email: string, password: string) {
  if (!authConfigured || !window.crypto?.subtle) return false;
  const ok = safeEqual(await hashCredentials(email, password), expected);
  if (ok) setItem(SESSION_KEY, expected, "session");
  return ok;
}

export const hasSession = () => authConfigured && getItem(SESSION_KEY, "session") === expected;
export const signOut = () => setItem(SESSION_KEY, null, "session");
