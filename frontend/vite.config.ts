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
      /*
       * ==========================================================
       * PWA REGISTRATION
       * ==========================================================
       *
       * Automatically registers the service worker.
       *
       * We do NOT need to manually create sw.js or registerSW.js.
       */
      registerType: "autoUpdate",

      injectRegister: "auto",

      /*
       * ==========================================================
       * PWA MANIFEST
       * ==========================================================
       */

      manifest: {
        name: "Lottery Management System",

        short_name: "Lottery",

        description: "Lottery Management System",

        start_url: "/",

        scope: "/",

        display: "standalone",

        orientation: "portrait-primary",

        theme_color: "#0f172a",

        background_color: "#0f172a",

        categories: ["entertainment", "games"],

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },

          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      /*
       * ==========================================================
       * SERVICE WORKER
       * ==========================================================
       */

      workbox: {
        /*
         * Cache the application's generated assets.
         */
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}"],

        /*
         * Do not aggressively cache API responses.
         *
         * Your lottery data, wallet balance, deposits,
         * withdrawals, etc. must continue using the live API.
         */
        navigateFallback: "/index.html",

        navigateFallbackDenylist: [/^\/api\//],

        cleanupOutdatedCaches: true,

        clientsClaim: true,

        skipWaiting: true,
      },

      /*
       * ==========================================================
       * DEVELOPMENT
       * ==========================================================
       *
       * Keep PWA disabled during normal `npm run dev`.
       *
       * This avoids service-worker caching interfering with
       * your development environment.
       */
      devOptions: {
        enabled: false,
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
