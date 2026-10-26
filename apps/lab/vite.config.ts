import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The lab resolves @guategeeks/* through their default (dist) exports, exactly like a product.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
