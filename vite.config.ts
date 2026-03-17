import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  root: 'src/demo',
  build: {
    outDir: '../../dist-demo',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@webitel/chats-web-sdk': '..',
    },
  },
});

