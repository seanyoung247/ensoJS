
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { testMode } from '../shared.js';


let prop, attr, watches;
beforeAll(async () => {
  const mod = await testMode.importModule();
  ({ prop, attr, watches } = mod);
});

// Mock factory maker
describe('prop()', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates shallow descriptor for primitive values', () => {
        const desc = prop(123);

        expect(desc._prop).toBe(true);
        expect(desc.deep).toBe(false);
        expect(desc.attribute).toBe(false);
    });

    it('enables deep reactivity only if deep=true AND value is object', () => {
        const obj = { a: 1 };

        const shallow = prop(obj, false);
        expect(shallow.deep).toBe(false);

        const deep = prop(obj, true);
        expect(deep.deep).toBe(true);
    });

    it('does not enable deep reactivity for primitives even when deep=true', () => {
        const desc = prop(42, true);
        expect(desc.deep).toBe(false);
    });

    it('accepts factroy functions', () => {
      const factory = ()=>({x:1,y:2,z:3});
      const desc = prop(factory);
      expect(desc.value).toEqual(factory);
    });
});


describe('attr()', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates a descriptor for string values', () => {
        const desc = attr('hello');

        expect(desc._prop).toBe(true);
        expect(desc.attribute.type).toBe(String);
        expect(desc.attribute.force).toBe(true);
        expect(desc.deep).toBe(false);
    });

    it('infers type from numeric value', () => {
        const desc = attr(123);
        expect(desc.attribute.type).toBe(Number);
    });

    it('infers type from boolean value', () => {
        const desc = attr(true);
        expect(desc.attribute.type).toBe(Boolean);
    });

    it('does not force when value=null', () => {
        const desc = attr(null);
        expect(desc.attribute.force).toBe(false);
    });

    it('throws if value is an object', () => {
        expect(() => attr({})).toThrow();
        expect(() => attr([])).toThrow();
    });

    it('throws if type is not allowed', () => {
        expect(() => attr(null, Date)).toThrow();
    });

});


describe('watches()', () => {

    it('sets __watches on a function input', () => {
        const fn = function() {};
        const result = watches(fn, ['a', 'b']);

        expect(result).toBe(fn); // returns original
        expect(result.__watches).toEqual({
            props: ['a', 'b'],
            keep: false
        });
    });

    it('respects the keep=true flag', () => {
        const fn = function() {};
        watches(fn, ['x'], true);

        expect(fn.__watches).toEqual({
            props: ['x'],
            keep: true
        });
    });

    it('allows empty props array', () => {
        const fn = function() {};
        watches(fn, []);

        expect(fn.__watches).toEqual({
            props: [],
            keep: false
        });
    });

    it('allows missing props array', () => {
        const fn = function() {};
        watches(fn);

        expect(fn.__watches).toEqual({
            props: [],
            keep: false
        });
    });

    it('throws on non-function inputs', () => {
        expect(() => watches(null, ['x'])).toThrow();
        expect(() => watches(5, ['x'])).toThrow();
        expect(() => watches('hello', ['x'])).toThrow();
        expect(() => watches({}, ['x'])).toThrow();
        expect(() => watches([], ['x'])).toThrow();
        // expect(() => watches(()=>{}, ['x'])).toThrow(); // No longer banning arrow functions
    });

});
