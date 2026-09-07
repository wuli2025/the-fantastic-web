import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        igloo: fileURLToPath(new URL('./index.html', import.meta.url)),
        forma: fileURLToPath(new URL('./forma.html', import.meta.url)),
      },
    },
  },
  server: {
    // Polling also detects edits when this project lives on a Windows drive in WSL.
    watch: { usePolling: true, interval: 300 },
  },
});
