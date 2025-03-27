import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist'
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: ['.onrender.com'] // ← разрешает все сабдомены Render
  }
})
