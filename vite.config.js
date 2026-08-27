import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Se o erro EBUSY do watcher voltar a derrubar o servidor no Windows,
  // descomente o bloco abaixo.
  // server: {
  //   watch: { usePolling: true, interval: 300 },
  // },
})