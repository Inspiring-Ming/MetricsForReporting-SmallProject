import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { 
    proxy: { 
      "^/SAGE/report": { target: "http://localhost:3001", changeOrigin: true },
      '^/SAGE/reports': { target: 'http://localhost:3001', changeOrigin: true },
      "^/api": { target: "http://localhost:3000", changeOrigin: true },  // Docker backend for KG APIs
      "^/SAGE":   { target: "http://localhost:3001", changeOrigin: true },  // Root backend for DynamoDB
    } 
  }
})
