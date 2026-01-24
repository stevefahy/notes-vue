import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  optimizeDeps: {
    include: ['vue', 'vuetify'],
  },
  // Add build optimizations
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress eval warnings from gray-matter
        if (
          warning.code === 'EVAL' &&
          warning.id?.includes('gray-matter')
        ) {
          return
        }
        // Use default warning handler for all other warnings
        warn(warning)
      },
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'vuetify-vendor': ['vuetify'],
        }
      }
    }
  }
})