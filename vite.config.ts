import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Lets the service worker register during `npm run dev` too, not just
      // production builds — makes it possible to actually test installability
      // and offline behavior against the dev server.
      devOptions: { enabled: true },
      includeAssets: ['icons/favicon-32.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Workshop Tracker',
        short_name: 'Workshop Tracker',
        description: 'SUMAI Engineering internal vehicle workshop tracker.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // Matches the app's header/brand navy (--blue-900 in tokens.css) so
        // the OS status bar and splash screen don't clash with the app shell.
        background_color: '#131F5E',
        theme_color: '#131F5E',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the built app shell (JS/CSS/HTML/icons) so the app still
        // opens offline; all real data still requires a live connection to
        // Supabase — this only makes the shell itself resilient to a dropped
        // connection, not the workshop data.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
