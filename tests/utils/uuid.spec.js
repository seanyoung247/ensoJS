

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect } from 'vitest';
import { uuid, scopedId } from '../../src/utils/uuid.js';

describe('uuid', () => {
  it('returns a string of the correct length', () => {
    const id = uuid(8);
    expect(typeof id).toBe('string');
    expect(id.length).toBe(8);
  });

  it('defaults to length 6 when not specified', () => {
    const id = uuid();
    expect(id.length).toBe(6);
  });

  it('always returns alphanumeric characters from the alphabet', () => {
    // Assuming alphabet is defined in the same module scope
    const id = uuid(12);
    expect(/^[a-zA-Z0-9_-]+$/.test(id)).toBe(true);
  });

  it('handles non-integer and negative lengths gracefully', () => {
    expect(uuid(-5)).toBe('');
    expect(uuid(3.7).length).toBe(3);
  });

  it('produces different values most of the time', () => {
    const a = uuid();
    const b = uuid();
    expect(a).not.toBe(b);
  });
});

describe('scopedId', () => {
  it('returns a function', () => {
    const gen = scopedId('enso', 4);
    expect(typeof gen).toBe('function');
  });

  it('generates incrementing IDs with same base', () => {
    const gen = scopedId('enso', 4);
    const first = gen();
    const second = gen();

    expect(first).toMatch(/^enso-[a-zA-Z0-9_-]{4}-1$/);
    expect(second).toMatch(/^enso-[a-zA-Z0-9_-]{4}-2$/);

    // Check same base part
    const base1 = first.split('-')[1];
    const base2 = second.split('-')[1];
    expect(base1).toBe(base2);
  });

  it('creates independent sequences for separate scopedId calls', () => {
    const gen1 = scopedId('enso', 3);
    const gen2 = scopedId('enso', 3);

    const id1 = gen1();
    const id2 = gen2();

    const base1 = id1.split('-')[1];
    const base2 = id2.split('-')[1];
    expect(base1).not.toBe(base2);
  });

  it('respects custom prefix and length', () => {
    const gen = scopedId('custom', 2);
    const id = gen();
    expect(id).toMatch(/^custom-[a-zA-Z0-9_-]{2}-1$/);
  });
});

