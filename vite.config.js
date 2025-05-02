import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Type': 'application/javascript',
    },
  },
  build: {
    assetsInlineLimit: 0, // Prevenir inlining de SVGs y otros activos
    rollupOptions: {
      output: {
        manualChunks: undefined, // Ayuda a que los chunks se sirvan correctamente
      },
    },
  },
})
