
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
        'src/core/symbols.js',  // No logic to cover
      ],
    },
  },
}); 