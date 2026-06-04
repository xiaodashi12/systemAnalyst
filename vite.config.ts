import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide')) {
              return 'vendor-icons';
            }
            if (id.includes('vue') || id.includes('pinia')) {
              return 'vendor-vue-core';
            }
            return 'vendor-others';
          }
        }
      }
    }
  }
})



