// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: "https://alexislours.com",

  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Newsreader",
        cssVariable: "--font-newsreader",
        weights: [300, 400, 500, 600],
        styles: ["normal", "italic"],
        fallbacks: ["serif"],
      },
      {
        provider: fontProviders.google(),
        name: "Inter",
        cssVariable: "--font-inter",
        weights: [400, 500, 600],
        styles: ["normal"],
        fallbacks: ["system-ui", "-apple-system", "sans-serif"],
      }
    ]
  },

  vite: {
    plugins: [tailwindcss()]
  },

  redirects: {
    '/links': '/about',
  },

  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'live.staticflickr.com',
      },
      {
        protocol: 'https',
        hostname: '**.flickr.com',
      },
      {
        protocol: 'https',
        hostname: '**.mapbox.com',
      }
    ]
  },

  integrations: [sitemap()],
});