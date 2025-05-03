// filepath: d:\project1\chatapp\frontend\vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),
  tailwindcss(),
  ],
});