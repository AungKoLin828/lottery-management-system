import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";

import { VitePWA } from "vite-plugin-pwa";

import path from "node:path";

import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),

    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["favicon.svg", "apple-touch-icon.png"],

      manifest: {
        id: "/",

        name: "Lottery Management System",

        short_name: "Lottery",

        description:
          "Lottery Management System for players and administrators.",

        start_url: "/",

        scope: "/",

        display: "standalone",

        orientation: "portrait-primary",

        theme_color: "#0f172a",

        background_color: "#0f172a",

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },

          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },

          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        clientsClaim: true,

        skipWaiting: true,

        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
