import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    minify: mode === 'production' ? 'terser' : undefined,
    terserOptions:
      mode === 'production'
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : undefined,
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (!id.includes('node_modules')) return
          if (id.includes('framer-motion')) return 'vendor-framer-motion'
          if (id.includes('react-dom')) return 'vendor-react-dom'
          if (id.includes('/react/') || id.includes('\\react\\')) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
}))
