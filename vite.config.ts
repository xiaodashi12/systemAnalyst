import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import obfuscator from 'rollup-plugin-obfuscator'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    sourcemap: false, // Ensure source maps are disabled so original code cannot be reconstructed
    rollupOptions: {
      plugins: [
        obfuscator({
          options: {
            compact: true,
            controlFlowFlattening: false, // Set false to maintain performance
            deadCodeInjection: false,
            debugProtection: true, // Prevents console debugger
            debugProtectionInterval: 4000,
            disableConsoleOutput: true, // Disables console logging
            selfDefending: true, // Prevents pretty-printing/formatting
            stringArray: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayThreshold: 0.8,
          },
        }),
      ],
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
