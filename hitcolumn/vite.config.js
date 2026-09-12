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
        enabled: false,
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
        // ✅ Force new SW to take over on deploy
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,

        // ✅ Raise cache limit (optional — but globIgnores is the real fix)
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,

        // ✅ Only precache small files
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // ✅ EXCLUD large assets from precache
        globIgnores: [
          '**/hitlogo*.png',
          '**/darkbg*.jpg',
          '**/hitlogo-*.png',
          '**/darkbg-*.jpg'
        ],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
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
          },
          {
            // Cache hitlogo/darkbg at runtime (not precache)
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hitcolumn-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
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