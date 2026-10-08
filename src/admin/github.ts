// Publishes admin edits by committing to the repo through the GitHub API.
// Each commit triggers .github/workflows/deploy.yml, which rebuilds the site.
import { getJson, setJson } from "../lib/storage";

export const CONTENT_PATH = "src/content/content.json";
export const IMAGE_DIR = "public/images";

const CONFIG_KEY = "sable-admin-github";

export type GitHubConfig = { token: string; repo: string; branch: string };

export function loadConfig(): GitHubConfig {
  const saved = getJson<Partial<GitHubConfig>>(CONFIG_KEY) ?? {};
  return {
    token: saved.token ?? "",
    repo: saved.repo || import.meta.env.VITE_CONTENT_REPO || "",
    branch: saved.branch || import.meta.env.VITE_CONTENT_BRANCH || "main",
  };
}

export const saveConfig = ({ token, repo, branch }: GitHubConfig) =>
  setJson(CONFIG_KEY, { token: token.trim(), repo: repo.trim(), branch: branch.trim() });

async function api<T>(config: GitHubConfig, path: string, init: RequestInit = {}): Promise<T | null> {
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
  const name = `${base}-${Date.now().toString(36)}.${image.type === "image/webp" ? "webp" : (originalName.split(".").pop() ?? "jpg").toLowerCase()}`;
  await putFile(config, `${IMAGE_DIR}/${name}`, await toBase64(image), `Add image ${name} from admin panel`);
  return `images/${name}`;
}
