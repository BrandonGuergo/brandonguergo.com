import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    // French, Cottage, and Photographs are their own pages. French stays
    // unlinked from the home page. Cottage is linked from the work section.
    // Photographs is linked from the Other Works menu.
    // Agora support, privacy, and terms are their own pages and are not linked from home.
    rollupOptions: {
      input: {
        main: 'index.html',
        french: 'french/index.html',
        cottage: 'cottage/index.html',
        photographs: 'photographs/index.html',
        agoraSupport: 'agora-support/index.html',
        agoraPrivacy: 'agora-privacy/index.html',
        agoraTerms: 'agora-terms/index.html',
      },
    },
  },
})
