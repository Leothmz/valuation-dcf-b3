import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Escuta em todas as interfaces (0.0.0.0), não só em loopback. Sem isso o
    // dev server só existe para a própria máquina e testar pelo IP da rede
    // (http://192.168.1.104:5173) falha sem erro visível — a porta simplesmente
    // não responde. Fica aqui e não no script `dev` para valer também em
    // `npx vite` e no webServer do Playwright.
    //
    // O backend não precisa do mesmo: o celular fala só com o Vite, que faz o
    // proxy de /api para localhost:8001 do lado do servidor.
    host: true,
    proxy: {
      '/api': 'http://localhost:8001',
    },
  },
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
