// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://alexislours.com",

  experimental: {
    fonts: [
      {
        provider: "local",
        name: "Newsreader",
        cssVariable: "--font-newsreader",
        fallbacks: ["serif"],
        variants: [
          {
            weight: 400,
            style: "normal",
            src: ["./src/assets/fonts/newsreader.woff2"],
          },
        ],
      },
      {
        provider: "local",
        name: "Inter",
        cssVariable: "--font-inter",
        fallbacks: ["system-ui", "-apple-system", "sans-serif"],
        variants: [
          {
            weight: 400,
            style: "normal",
            src: ["./src/assets/fonts/inter.woff2"],
          },
        ],
      },
    ],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  redirects: {
    "/links": "/about",
  },

  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "live.staticflickr.com",
      },
      {
        protocol: "https",
        hostname: "**.flickr.com",
      },
      {
        protocol: "https",
        hostname: "**.mapbox.com",
      },
    ],
  },

  integrations: [sitemap()],
});
