import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Production optimizations
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          styled: ['styled-components'],
          canvas: ['html2canvas']
        }
      }
    },
    // Reduce bundle size warnings threshold
    chunkSizeWarningLimit: 1000
  },
  // Environment variables validation
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  // Security headers in development
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }
  }
})
