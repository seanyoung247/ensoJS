
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Polyfill __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    minify: 'terser',
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'Enso',
      fileName: (format) => `enso.${format}.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named',
      },
    },
  },
});
