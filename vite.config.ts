import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// GitHub Pages can't send security headers, so the policy ships as a <meta>
// tag. It limits scripts to our own bundle and network calls to the GitHub
// API, which is what keeps an admin's token from being sent anywhere else.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.github.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
].join("; ");

// Build only: the dev server relies on inline scripts for hot reload.
const securityHeaders = (): Plugin => ({
  name: "security-meta",
  apply: "build",
  transformIndexHtml: () => [
    { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: contentSecurityPolicy }, injectTo: "head-prepend" },
    { tag: "meta", attrs: { name: "referrer", content: "strict-origin-when-cross-origin" }, injectTo: "head-prepend" },
  ],
});

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; the deploy workflow sets this.
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), securityHeaders()],
});
