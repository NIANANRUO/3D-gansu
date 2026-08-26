import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // 相对路径打包，完美适配 GitHub Pages、Vercel 等任何部署环境
  server: {
    port: 3001,
    host: true,
  },
});
