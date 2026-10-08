import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; the deploy workflow sets this.
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
});
