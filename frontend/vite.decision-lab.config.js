import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

// This bundle is built explicitly and is never copied into the normal MiroFish image.
export default defineConfig({
  plugins: [vue()],
  publicDir: false,
  build: {
    outDir: 'dist-decision-lab',
    rollupOptions: { input: fileURLToPath(new URL('./decision-lab.html', import.meta.url)) },
  },
})
