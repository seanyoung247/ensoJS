
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect } from 'vitest';
import { classList, cssObj } from '../../../src/utils/helpers.js';

describe('classList', () => {
  it('joins truthy values into a space-separated string', () => {
    expect(classList('foo', 'bar')).toBe('foo bar');
  });

  it('ignores falsy values', () => {
    expect(classList('foo', null, undefined, '', false, 'bar')).toBe('foo bar');
  });

  it('returns empty string if all falsy', () => {
    expect(classList('', false, null)).toBe('');
  });
});

describe('cssObj', () => {
  it('converts a flat object to a CSS string', () => {
    const result = cssObj({ color: 'red', fontSize: '12px' });
    expect(result).toContain('color:red;');
    expect(result).toContain('font-size:12px;');
  });

  it('handles nested objects as selectors', () => {
    const result = cssObj({
      color: 'red',
      '.child': { fontSize: '14px' },
    });
    expect(result).toContain('color:red;');
    expect(result).toContain('.child {font-size:14px;}');
  });

  it('skips falsy values', () => {
    const result = cssObj({ color: '', fontSize: null, display: 'block' });
    expect(result).toBe('display:block;');
  });

  it('handles deep nesting', () => {
    const result = cssObj({
      '.parent': { '.child': { color: 'blue' } },
    });
    expect(result).toBe('.parent {.child {color:blue;}\n}\n');
  });
});