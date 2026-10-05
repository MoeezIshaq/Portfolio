import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The 3D scene is a lazily loaded chunk; it is large but never blocks first paint.
  build: { chunkSizeWarningLimit: 1200 },
})
