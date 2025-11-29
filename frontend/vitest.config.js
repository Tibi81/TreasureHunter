import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    css: true,
    coverage: {
      provider: 'v8',
      include: [
        'src/components/Welcome.jsx',
        'src/components/PlayerRegistration.jsx',
        'src/services/api.js',
      ],
    },
  },
})
