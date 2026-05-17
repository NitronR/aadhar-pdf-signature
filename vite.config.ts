import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from "@cloudflare/vite-plugin"
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cloudflare(),
    {
      name: 'static-hi-page',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/hi' || req.url === '/hi/') {
            const filePath = path.resolve(process.cwd(), 'public/hi/index.html')
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(fs.readFileSync(filePath))
            return
          }
          next()
        })
      },
    },
  ],
})