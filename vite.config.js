// vite.config.js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // --- AÑADE ESTA SECCIÓN ---
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separa las librerías más pesadas en sus propios archivos
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'vendor-firebase'
            }
            if (id.includes('primevue')) {
              return 'vendor-primevue'
            }
            // Agrupamos las de exportación
            if (id.includes('exceljs') || id.includes('jspdf')) {
              return 'vendor-exporting'
            }
            // Agrupa el resto de 'node_modules' en un chunk 'vendor'
            return 'vendor'
          }
        }
      }
    }
  }
})
