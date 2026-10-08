// Publishes admin edits by committing to the repo through the GitHub API.
// Each commit triggers .github/workflows/deploy.yml, which rebuilds the site.
import { getJson, setJson } from "../lib/storage";

const CONTENT_PATH = "src/content/content.json";
const IMAGE_DIR = "public/images";
// "owner/name" only: no "..", so a typo can never point the token at other API paths.
const REPO_PATTERN = /^[\w-]+\/(?!\.\.?$)[\w.-]+$/;
const EXTENSIONS: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };

const CONFIG_KEY = "sable-admin-github";

export type GitHubConfig = { token: string; repo: string; branch: string; remember: boolean };

export function loadConfig(): GitHubConfig {
  const session = getJson<Partial<GitHubConfig>>(CONFIG_KEY, "session");
  const saved = session ?? getJson<Partial<GitHubConfig>>(CONFIG_KEY) ?? {};
  return {
    remember: !session && Boolean(saved.token),
    token: saved.token ?? "",
    repo: saved.repo || import.meta.env.VITE_CONTENT_REPO || "",
    branch: saved.branch || import.meta.env.VITE_CONTENT_BRANCH || "main",
  };
}

// By default the token only lives for this browser tab session. Every site on
// <user>.github.io shares one storage origin, so "remember" is opt-in.
export function saveConfig({ token, repo, branch, remember }: GitHubConfig) {
  const value = { token: token.trim(), repo: repo.trim(), branch: branch.trim() };
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
