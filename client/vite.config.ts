import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The browser talks only to Vite (5173). Requests to /api and /uploads are
// forwarded to the Express server (3001), so no API keys or CORS tricks are
// needed in frontend code.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
});
