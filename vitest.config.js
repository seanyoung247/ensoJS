
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
      reportsDirectory: './tests/coverage',
      exclude: [
        'tests/**',
        'vitest.config.js',
        '.eslintrc.js',
        'src/utils/loaders.js', // Requires network access
        'src/core/symbols.js',  // No logic to cover
        'src/enso.js',          // No logic to cover

        'examples/**',          // Don't care about examples
      ],
    },
  },
});
