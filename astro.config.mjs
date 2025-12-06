// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: "https://alexislours.com",

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