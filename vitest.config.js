
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { defineConfig } from 'vitest/config';
import { testMode } from './tests/shared';


export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: testMode.tests,
    benchmark: {
      include: ['benchmarks/**/*.bench.js'],
      time: 500,
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './tests/coverage',
      exclude: [
        'tests/**',
        'vitest.config.js',
        '.eslintrc.js',
        'src/templates/parsers/parsers.js', // No logic to cover
        'src/core/symbols.js',              // No logic to cover
        'src/errors/**',                    // Just maps error codes to text
        '*/index.js',                       // No logic to cover
        'version.js',                       // Injects version, don't care
        'examples/**',                      // Don't care about examples
      ],
    },
  },
});
