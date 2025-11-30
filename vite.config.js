
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

import viteRaw from './vite-raw.js';

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
  resolve: {
    alias: {
      enso: path.resolve(__dirname, "/src")
    }
  },
  plugins: [
    // Little patch to stop vite mangling css/html in loaders.
    viteRaw()
  ]
});
