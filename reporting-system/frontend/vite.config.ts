import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { 
    proxy: { 
      "^/SAGE/report": { target: process.env.VITE_BACKEND_URL || "http://localhost:3001", changeOrigin: true }, // Root backend for Report API
      '^/SAGE/reports': { target: process.env.VITE_BACKEND_URL || "http://localhost:3001", changeOrigin: true }, // Root backend for Report API
      "^/api": { target: process.env.VITE_KG_API_URL || "http://localhost:3000", changeOrigin: true },  // Docker backend for KG APIs
      "^/SAGE":   { target: process.env.VITE_BACKEND_URL || "http://localhost:3001", changeOrigin: true },  // Root backend for DynamoDB
    } 
  },
  preview: {
    proxy: {
      "^/SAGE/report": { target: process.env.VITE_BACKEND_URL || "http://localhost:3001", changeOrigin: true },
      '^/SAGE/reports': { target: process.env.VITE_BACKEND_URL || "http://localhost:3001", changeOrigin: true },
      "^/api": { target: process.env.VITE_KG_API_URL || "http://localhost:3000", changeOrigin: true },
      "^/SAGE":   { target: process.env.VITE_BACKEND_URL || "http://localhost:3001", changeOrigin: true },
    }
  }
})
