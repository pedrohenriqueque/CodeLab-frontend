import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Mantém o cache do navegador separado dos servidores Vite usados nos testes.
  cacheDir: 'node_modules/.vite-dev',
  plugins: [react()],
})
