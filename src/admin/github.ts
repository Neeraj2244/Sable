// Publishes admin edits by committing to the repo through the GitHub API.
// Each commit triggers .github/workflows/deploy.yml, which rebuilds the site.
import { getJson, setJson } from "../lib/storage";
import type { Bytes } from "./auth";

const CONTENT_PATH = "src/content/content.json";
const IMAGE_DIR = "public/images";
// "owner/name" only: no "..", so a typo can never point the token at other API paths.
const REPO_PATTERN = /^[\w-]+\/(?!\.\.?$)[\w.-]+$/;
const EXTENSIONS: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };

const CONFIG_KEY = "sable-admin-github";

export type GitHubConfig = { token: string; repo: string; branch: string; remember: boolean };

// What is written to browser storage: the token only ever in encrypted form.
type Stored = { repo?: string; branch?: string; iv?: string; token?: string };

export const defaultConfig = (): GitHubConfig => ({
  token: "",
  remember: false,
  repo: import.meta.env.VITE_CONTENT_REPO || "",
  branch: import.meta.env.VITE_CONTENT_BRANCH || "main",
});

// AES-GCM key bound to the admin's password-derived session key (auth.ts).
async function tokenCipher(secret: Bytes) {
  const base = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info: new TextEncoder().encode("sable-github-token") },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"],
  );
}
const toB64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = (text: string) => Uint8Array.from(atob(text), (ch) => ch.charCodeAt(0));

/** Reads saved settings; the token decrypts only with the signed-in admin's key. */
export async function loadConfig(secret: Bytes | null): Promise<GitHubConfig> {
  const session = getJson<Stored>(CONFIG_KEY, "session");
  const saved = session ?? getJson<Stored>(CONFIG_KEY) ?? {};
  let token = "";
  if (secret && saved.iv && saved.token) {
    try {
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(saved.iv) }, await tokenCipher(secret), fromB64(saved.token));
      token = new TextDecoder().decode(plain);
    } catch { /* different password or tampered value: ask for the token again */ }
  }
  const defaults = defaultConfig();
  return { token, remember: !session && Boolean(token), repo: saved.repo || defaults.repo, branch: saved.branch || defaults.branch };
}

// By default settings last for this browser tab only; "remember" keeps them on
// the device. Either way the token is stored encrypted, never in plain text.
export async function saveConfig({ token, repo, branch, remember }: GitHubConfig, secret: Bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await tokenCipher(secret), new TextEncoder().encode(token.trim()));
  const value: Stored = { repo: repo.trim(), branch: branch.trim(), iv: toB64(iv), token: toB64(encrypted) };
  setJson(CONFIG_KEY, remember ? value : null);
  setJson(CONFIG_KEY, remember ? null : value, "session");
}

async function api<T>(config: GitHubConfig, path: string, init: RequestInit = {}): Promise<T | null> {
  if (!REPO_PATTERN.test(config.repo)) throw new Error("Repository must look like owner/name.");
  const response = await fetch(`https://api.github.com/repos/${config.repo}${path}`, {
    ...init,
    cache: "no-store",
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${config.token}`, "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const message = await response.json().then((body: { message?: string }) => body.message, () => "");
    throw new Error(`GitHub said ${response.status}${message ? `: ${message}` : ""}`);
  }
  return response.json() as Promise<T>;
}

export async function checkAccess(config: GitHubConfig) {
  const repo = await api<{ permissions?: { push?: boolean } }>(config, "");
  if (!repo) throw new Error("Repository not found, or the token cannot see it.");
  if (!repo.permissions?.push) throw new Error("This token can read the repository but cannot write to it.");
}

/** Creates or replaces one file in a single commit. */
async function putFile(config: GitHubConfig, path: string, base64: string, message: string) {
  const existing = await api<{ sha: string }>(config, `/contents/${path}?ref=${encodeURIComponent(config.branch)}`);
  await api(config, `/contents/${path}`, { method: "PUT", body: JSON.stringify({ message, content: base64, branch: config.branch, sha: existing?.sha }) });
}

async function toBase64(blob: Blob) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

export const publishContent = async (config: GitHubConfig, content: unknown) =>
  putFile(config, CONTENT_PATH, await toBase64(new Blob([`${JSON.stringify(content, null, 2)}\n`])), "Update site content from admin panel");

/** Uploads an already-optimised image and returns its content path. */
export async function uploadImage(config: GitHubConfig, image: Blob, originalName: string) {
  const base = originalName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image";
  const extension = EXTENSIONS[image.type];
  if (!extension) throw new Error("Unsupported image type.");
  const name = `${base}-${Date.now().toString(36)}.${extension}`;
  await putFile(config, `${IMAGE_DIR}/${name}`, await toBase64(image), `Add image ${name} from admin panel`);
  return `images/${name}`;
}
