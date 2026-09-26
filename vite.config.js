import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  cacheDir: './.vite-cache-run',
  optimizeDeps: { include: ['react', 'react-dom/client', 'react/jsx-runtime'] },
})
