// Client-side gate for the admin panel.
//
// At build time scripts/hash-admin-credentials.mjs derives a key
//   K = PBKDF2-SHA256("email\npassword", salt, 600k)
// and ships only its fingerprint SHA-256(K). Signing in re-derives K from the
// password; the session holds K itself, which cannot be computed from the
// public fingerprint, so the session can't be forged from the bundle. K also
// encrypts the stored GitHub token (see github.ts), so a copied browser
// storage is useless without the password.
//
// The GitHub token remains what actually protects the live site: the editor's
// code is public, and nothing can be published without a token.
import { getItem, setItem } from "../lib/storage";

const SESSION_KEY = "sable-admin-session";
export type Bytes = Uint8Array<ArrayBuffer>;
const { VITE_ADMIN_SALT: salt = "", VITE_ADMIN_HASH: fingerprint = "", VITE_ADMIN_ITERATIONS } = import.meta.env;
const iterations = Number(VITE_ADMIN_ITERATIONS ?? 600000);

export const authConfigured = Boolean(salt && fingerprint);

const toHex = (bytes: ArrayBuffer | Bytes) => Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
export const fromHex = (hex: string): Bytes => new Uint8Array(hex.match(/.{2}/g)?.map((pair) => parseInt(pair, 16)) ?? []);
const sha256Hex = async (bytes: Bytes) => toHex(await crypto.subtle.digest("SHA-256", bytes));

// Constant-time compare so response timing doesn't leak how much matched.
const safeEqual = (a: string, b: string) => a.length === b.length && [...a].reduce((diff, ch, i) => diff | (ch.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

async function deriveKey(email: string, password: string): Promise<Bytes> {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(`${email.trim().toLowerCase()}\n${password}`), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromHex(salt), iterations }, material, 256));
}

const matches = async (key: Bytes) => key.length === 32 && safeEqual(await sha256Hex(key), fingerprint);

export async function signIn(email: string, password: string) {
  if (!authConfigured || !window.crypto?.subtle) return false;
  const key = await deriveKey(email, password);
  if (!(await matches(key))) return false;
  setItem(SESSION_KEY, toHex(key), "session");
  return true;
}

/** The signed-in admin's secret key, or null when not signed in (or the session was tampered with). */
export async function sessionKey(): Promise<Bytes | null> {
  const stored = getItem(SESSION_KEY, "session");
  if (!authConfigured || !stored || !window.crypto?.subtle) return null;
  const key = fromHex(stored);
  return (await matches(key)) ? key : null;
}

export const signOut = () => setItem(SESSION_KEY, null, "session");
