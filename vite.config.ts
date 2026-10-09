import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

// GitHub Pages can't send security headers, so the policy ships as a <meta>
// tag (and in dist/_headers for hosts that read it). It limits scripts to our
// own bundle and network calls to the GitHub API, which is what keeps an
// admin's token from being sent anywhere else. Google Analytics and Meta Pixel
// are allowed only when their IDs are set in content (admin → Search & sharing).
const { seo } = JSON.parse(readFileSync(new URL("./src/content/content.json", import.meta.url), "utf8"));
const ga4 = /^G-[A-Z0-9]{4,15}$/.test(seo?.ga4Id ?? "");
const pixel = /^\d{6,20}$/.test(seo?.metaPixelId ?? "");

export const contentSecurityPolicy = [
  "default-src 'self'",
  ["script-src 'self'", ga4 && "https://www.googletagmanager.com", pixel && "https://connect.facebook.net"].filter(Boolean).join(" "),
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  ["connect-src 'self' https://api.github.com", ga4 && "https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com", pixel && "https://www.facebook.com https://connect.facebook.net"].filter(Boolean).join(" "),
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

// The public address of the site, e.g. https://seratiramisu.com/ or
// https://user.github.io/Sable/. Its path becomes the build base, so moving
// to a custom domain is one setting (the SITE_URL repository variable).
const siteUrl = process.env.VITE_SITE_URL;

export default defineConfig({
  base: process.env.VITE_BASE ?? (siteUrl ? new URL(siteUrl).pathname : "/"),
  plugins: [react(), securityHeaders()],
});
