import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves the app under /<repo>/. Override with BASE=/ for local preview.
const base = process.env.BASE ?? "/workout/";

export default defineConfig({
  base,
  build: { rollupOptions: { input: { main: "index.html", bakeoff: "bakeoff.html" } } },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Workout",
        short_name: "Workout",
        description: "Training log, stretching and progress. Works offline.",
        start_url: base,
        scope: base,
        display: "standalone",
        orientation: "portrait",
        background_color: "#0E0E0E",
        theme_color: "#0E0E0E",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,woff2,webp,mp4}"],
        globIgnores: ["**/render3d*"],
        navigateFallback: "index.html",
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
