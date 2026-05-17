
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import viteRaw from './vite-raw.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
);

export default defineConfig({
  root: './',
  define: {
    __VERSION__: JSON.stringify(pkg.version)
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: true,
    lib: {
        entry: path.resolve(__dirname, 'src/index.js'),
        name: 'ensojs',
        fileName: (format) => `ensojs.${format}.js`,
        formats: ['es']
    },
    rollupOptions: {
      input: {
        ensojs: path.resolve(__dirname, 'src/index.js'),
        errors: path.resolve(__dirname, 'src/errors/index.js'),
        helpers: path.resolve(__dirname, 'src/helpers/index.js'),
      },
      external: [],
      output: {
        entryFileNames: '[name].[format].js',
        exports: 'named',
        globals: {},
        format: 'es',
      },
    },
  },
  resolve: {
    // eslint-disable-next-line no-undef
    alias: process.env.NODE_ENV === "development"
      ? { ensojs: path.resolve(__dirname, './src') }
      : {}
  },
  plugins: [
    // Little plugin to stop vite mangling css/html in loaders
    // in the test server.
    viteRaw()
  ]
});
