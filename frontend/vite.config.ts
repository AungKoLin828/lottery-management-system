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
      /* ==========================================================
       * PWA REGISTRATION
       * ==========================================================
       *
       * vite-plugin-pwa automatically registers the service worker
       * in the production build.
       *
       * The service worker automatically checks for new versions.
       */

      registerType: "autoUpdate",

      injectRegister: "auto",

      /* ==========================================================
       * PWA ASSETS
       * ==========================================================
       *
       * These files must exist inside:
       *
       * public/
       *
       * Required:
       *
       * public/pwa-192x192.png
       * public/pwa-512x512.png
       * public/apple-touch-icon.png
       */

      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],

      /* ==========================================================
       * PWA MANIFEST
       * ==========================================================
       *
       * vite-plugin-pwa generates:
       *
       * /manifest.webmanifest
       *
       * during npm run build.
       */

      manifest: {
        name: "Lottery Management System",

        short_name: "Lottery2D",

        description: "Lottery Management System for 2D and 3D lottery.",

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
            purpose: "any",
          },

          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },

          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },

          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      /* ==========================================================
       * SERVICE WORKER / WORKBOX
       * ==========================================================
       *
       * Static frontend assets are cached.
       *
       * API requests continue using the live API/database.
       *
       * We intentionally do NOT cache HTML through globPatterns.
       * Vite-generated JS/CSS assets contain hashes, so new builds
       * automatically receive new filenames.
       */

      workbox: {
        /* --------------------------------------------------------
         * STATIC ASSETS
         * --------------------------------------------------------
         *
         * HTML is intentionally excluded.
         */

        globPatterns: ["**/*.{js,css,ico,png,svg,webp,jpg,jpeg}"],

        /* --------------------------------------------------------
         * REACT ROUTER FALLBACK
         * --------------------------------------------------------
         *
         * Allows direct access to:
         *
         * /
         * /results-history
         * /about
         * /login
         * /register
         *
         * and other React routes.
         */

        navigateFallback: "/index.html",

        /* --------------------------------------------------------
         * API ROUTES
         * --------------------------------------------------------
         *
         * Never return index.html for API requests.
         *
         * This protects:
         *
         * /api/auth/*
         * /api/player/*
         * /api/admin/*
         * /api/report/*
         */

        navigateFallbackDenylist: [/^\/api(?:\/|$)/],

        /* --------------------------------------------------------
         * CACHE MAINTENANCE
         * --------------------------------------------------------
         *
         * Remove caches created by older service workers.
         */

        cleanupOutdatedCaches: true,

        /* --------------------------------------------------------
         * IMMEDIATE UPDATE
         * --------------------------------------------------------
         *
         * New service worker takes control immediately.
         */

        clientsClaim: true,

        skipWaiting: true,
      },

      /* ==========================================================
       * DEVELOPMENT
       * ==========================================================
       *
       * PWA is disabled during:
       *
       * npm run dev
       *
       * This prevents service-worker caching from interfering
       * with development.
       */

      devOptions: {
        enabled: false,
      },
    }),
  ],

  /* ============================================================
   * PATH ALIAS
   * ============================================================
   *
   * Allows:
   *
   * import Something from "@/components/Something";
   */

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
