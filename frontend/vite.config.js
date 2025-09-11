import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log('Proxy rewrite:', path);
          return path;
        },
        configure: (proxy, options) => {
          // eslint-disable-next-line no-unused-vars
          proxy.on('error', (err, req, res) => {
            console.log('Proxy hiba:', err.message);
            console.log('Kérés URL:', req.url);
            console.log('Target:', options.target);
          });
          // eslint-disable-next-line no-unused-vars
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxy továbbítás:', req.method, req.url, '->', options.target + req.url);
          });
          // eslint-disable-next-line no-unused-vars
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy válasz:', proxyRes.statusCode, 'a', req.url, 'kérésre');
          });
        },
      },
    },
  },
})