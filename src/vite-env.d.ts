/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Injected at build time by scripts/hash-admin-credentials.mjs from the
  // ADMIN_EMAIL / ADMIN_PASSWORD GitHub Actions secrets. Never the raw values.
  readonly VITE_ADMIN_SALT?: string;
  readonly VITE_ADMIN_HASH?: string;
  readonly VITE_ADMIN_ITERATIONS?: string;
  // "owner/repo" and branch the admin panel publishes content to.
  readonly VITE_CONTENT_REPO?: string;
  readonly VITE_CONTENT_BRANCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
