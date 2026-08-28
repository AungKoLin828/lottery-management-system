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
       * Automatically registers the service worker.
       *
       * The service worker will automatically update when a new
       * version of the application is deployed.
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
       *   public/pwa-192x192.png
       *   public/pwa-512x512.png
       *   public/apple-touch-icon.png
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
       * This manifest is generated automatically by
       * vite-plugin-pwa during production build.
       */

      manifest: {
        name: "Lottery Management System",

        short_name: "Lottery",

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
       * SERVICE WORKER
       * ==========================================================
       *
       * Static frontend assets can be cached.
       *
       * API requests are NOT cached so the lottery application
       * continues using live database/API data.
       */

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}"],

        /* --------------------------------------------------------
         * React Router fallback
         * --------------------------------------------------------
         *
         * Allows routes such as:
         *
         * /results-history
         * /about
         * /login
         * /register
         *
         * to work when the PWA is opened directly.
         */

        navigateFallback: "/index.html",

        /* --------------------------------------------------------
         * Never use index.html fallback for API requests.
         *
         * This is important for:
         *
         * /api/auth/*
         * /api/player/*
         * /api/admin/*
         * /api/report/*
         * etc.
         */

        navigateFallbackDenylist: [/^\/api(?:\/|$)/],

        /* --------------------------------------------------------
         * Cache maintenance
         * ------------------------------------------------------ */

        cleanupOutdatedCaches: true,

        /* --------------------------------------------------------
         * Activate updated service worker immediately
         * ------------------------------------------------------ */

        clientsClaim: true,

        skipWaiting: true,
      },

      /* ==========================================================
       * DEVELOPMENT
       * ==========================================================
       *
       * Keep PWA disabled during:
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
   * ============================================================ */

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
