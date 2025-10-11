
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'tests/**',
        'src/utils/loaders.js', // Requires network access
        'src/utils/dom.js',     // Difficult to test DOM manipulation
        'src/utils/css.js',     // Difficult to test CSS manipulation
      ],
    },
  },
}); 