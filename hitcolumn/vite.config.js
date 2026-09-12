import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'favicon-32x32.png',
        'favicon-16x16.png'
      ],
      devOptions: {
        enabled: false, // ✅ disable in dev to avoid stale cache while testing
        type: 'module'
      },
      manifest: {
        name: 'HitColumn',
        short_name: 'HitColumn',
        description:
          'Where hits are uploaded. Stream and share music from artists everywhere.',
        theme_color: '#d36c42',
        background_color: '#070b12',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // ✅ Force new service worker to take over immediately
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,

        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/hitlogo-*.png', '**/darkbg-*.jpg'],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            // ✅ NetworkFirst for audio — serves fresh, falls back to cache only offline
            handler: 'NetworkFirst',
            options: {
              cacheName: 'hitcolumn-audio',
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
})