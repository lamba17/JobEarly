import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In production, Vercel routes /api/* to the serverless functions in api/
      // directly. In local dev, forward those calls to the Express server in server.ts.
      '/api': 'http://localhost:3001',
    },
  },
})
