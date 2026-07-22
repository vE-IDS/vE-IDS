import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const src = fileURLToPath(new URL('./src', import.meta.url))

// Where the dev server proxies /api. Defaults to the local Go server; in
// docker-compose the `web` service sets API_PROXY_TARGET=http://api:8080 so it
// reaches the api container across the compose network.
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8080'

// Static client-side SPA. `vite build` emits a self-contained dist/ that the Go
// API serves at /* in production. In dev, /api (REST + the /api/ws WebSocket) is
// proxied to the Go server.
export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': src,
      '#': src,
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
