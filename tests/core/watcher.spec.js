
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, vi } from 'vitest';
import { watch } from '../../src/core/watcher.js';

describe('watch()', () => {

  it('triggers onChange when object properties change', () => {
    const onChange = vi.fn();
    const obj = { a: 1, b: 2 };
    const proxy = watch(obj, 'test', onChange);

    proxy.a = 3;
    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('does not trigger onChange when setting same value', () => {
    const onChange = vi.fn();
    const obj = { a: 1 };
    const proxy = watch(obj, 'test', onChange);

    proxy.a = 1;
    expect(onChange).not.toHaveBeenCalled();
  });

  it('wraps nested objects recursively', () => {
    const onChange = vi.fn();
    const obj = { nested: { val: 1 } };
    const proxy = watch(obj, 'root', onChange);

    proxy.nested.val = 2;
    expect(onChange).toHaveBeenCalledWith('root');
  });

  it('wraps arrays and triggers onChange for mutating methods', () => {
    const onChange = vi.fn();
    const arr = [1, 2, 3];
    const proxy = watch(arr, 'arr', onChange);

    proxy.push(4);
    expect(onChange).toHaveBeenCalledWith('arr');

    proxy.pop();
    proxy.splice(0, 1);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('wraps Sets and triggers onChange for mutators', () => {
    const onChange = vi.fn();
    const set = new Set([1, 2]);
    const proxy = watch(set, 'set', onChange);

    proxy.add(3);
    proxy.delete(1);
    proxy.clear();

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenCalledWith('set');
  });

  it('wraps Maps and triggers onChange for mutators', () => {
    const onChange = vi.fn();
    const map = new Map([['a', 1]]);
    const proxy = watch(map, 'map', onChange);

    proxy.set('b', 2);
    proxy.delete('a');
    proxy.clear();

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenCalledWith('map');
  });

  it('returns same proxy when watching same object multiple times', () => {
    const onChange = vi.fn();
    const obj = {};
    const proxy1 = watch(obj, 'dup', onChange);
    const proxy2 = watch(obj, 'dup', onChange);
    expect(proxy1).toBe(proxy2);
  });

  it('returns target unchanged for non-objects', () => {
    const onChange = vi.fn();
    expect(watch(123, 'num', onChange)).toBe(123);
    expect(watch(null, 'nil', onChange)).toBeNull();
    expect(watch('text', 'str', onChange)).toBe('text');
  });
});