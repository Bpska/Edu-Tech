import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',         // Auto-updates SW on new deploy
      injectRegister: 'auto',             // Injects SW registration into HTML
      devOptions: {
        enabled: false,                   // DISABLED in dev — SW only active in production build
      },
      workbox: {
        // Precache all JS/CSS/HTML built assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Network-first for API calls (never cache auth/exam data)
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkOnly',
            options: { cacheName: 'api-cache' },
          },
          {
            urlPattern: /^https?:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https?:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https?:\/\/api\.fontshare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fontshare-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Offline fallback: only triggers when user is truly offline
        // navigateFallback is intentionally NOT set to avoid showing /offline.html
        // for missing routes — the React router handles all app routing.
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'Nexus Academy',
        short_name: 'Nexus',
        description: 'Premium exam practice, mock tests and courses — study anywhere, even offline.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#FFFBF1',
        theme_color: '#E36A6A',
        lang: 'en',
        scope: '/',
        categories: ['education', 'productivity'],
        icons: [
          { src: '/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: '/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: '/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-192x192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [],
        shortcuts: [
          {
            name: 'My Courses',
            short_name: 'Courses',
            description: 'Jump to your enrolled courses',
            url: '/courses',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Study Growth',
            short_name: 'Growth',
            description: 'View your progress and streak',
            url: '/growth',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      host: 'localhost',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
