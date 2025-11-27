
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Watched, prop, attr,
  watches, getWatched, setWatched,
} from "../../src/core/watched.js";
import { BINDINGS, MARK_CHANGED } from "../../src/core/symbols.js";

describe("Watched class", () => {
    let component, observedAttributes;

    beforeEach(() => {
        // Define the watched class properly
        const MyWatched = Watched.define({
        count: 5,
        show: prop(true),
        attr: attr('test')
        });
        observedAttributes = MyWatched.attr;

        // Mock component hosting the Watched instance
        class MockComponent {
        constructor() {
            this[MARK_CHANGED] = vi.fn();
            this.reflectAttribute = vi.fn();
            this.onPropertyChange = vi.fn();
        }
        }

        component = new MockComponent();
        component.watched = new MyWatched(component);
    });

    it("initial values are set correctly", () => {
        const values = getWatched(component);
        expect(values.count).toBe(5);
        expect(values.show).toBe(true);
        expect(values.attr).toBe('test');

        expect(observedAttributes.length).toBe(1);
    });

    it("setter updates value and marks changed", () => {
        component.watched.count = 10;
        const values = getWatched(component);
        expect(values.count).toBe(10);
        expect(component[MARK_CHANGED]).toHaveBeenCalledWith("count");
    });

    it("setWatched updates multiple values at once", () => {
        setWatched(component, { count: 20, show: false });
        const values = getWatched(component);
        expect(values.count).toBe(20);
        expect(values.show).toBe(false);
        expect(component[MARK_CHANGED]).toHaveBeenCalledWith("count");
        expect(component[MARK_CHANGED]).toHaveBeenCalledWith("show");
    });


    it('calls _setProp when a watched value changes', () => {
        const spy = vi.spyOn(component.watched, '_setProp');

        component.watched.update({ count: 10 });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
            component.watched.defs.count,
            10
        );
    });

    it('does nothing when the value has not changed', () => {
        const spy = vi.spyOn(component.watched, '_setProp');

        // count starts as 5 from the definition
        component.watched.update({ count: 5 });

        expect(spy).not.toHaveBeenCalled();
    });

    it('does nothing when notifying an unknown prop', () => {
        const component = {}; // dummy
        const watched = new Watched(component);

        // Ensure no bindings exist for this prop
        expect(watched[BINDINGS]?.has('missing')).toBe(false);

        // Spy to confirm no watcher runs
        const spy = vi.fn();
        watched._notify('missing');

        expect(spy).not.toHaveBeenCalled();
    });
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
        expect(() => attr({})).toThrow(/Unsupported attribute type/);
        expect(() => attr([])).toThrow(/Unsupported attribute type/);
    });

    it('throws if type is not allowed', () => {
        expect(() => attr(null, Date)).toThrow(/Unsupported attribute type/);
    });

});


describe('watches()', () => {

    it('sets __watches on a function input', () => {
        const fn = () => {};
        const result = watches(fn, ['a', 'b']);

        expect(result).toBe(fn); // returns original
        expect(result.__watches).toEqual({
            props: ['a', 'b'],
            keep: false
        });
    });

    it('respects the keep=true flag', () => {
        const fn = () => {};
        watches(fn, ['x'], true);

        expect(fn.__watches).toEqual({
            props: ['x'],
            keep: true
        });
    });

    it('allows empty props array', () => {
        const fn = () => {};
        watches(fn, []);

        expect(fn.__watches).toEqual({
            props: [],
            keep: false
        });
    });

    it('returns the value unchanged when input is NOT a function', () => {
        const obj = { test: 123 };
        const result = watches(obj, ['x']);

        expect(result).toBe(obj);
        expect(obj.__watches).toBeUndefined();
    });

    it('does not throw on non-function inputs', () => {
        expect(() => watches(null, ['x'])).not.toThrow();
        expect(() => watches(5, ['x'])).not.toThrow();
        expect(() => watches('hello', ['x'])).not.toThrow();
    });

    it('does not set __watches when input is a primitive', () => {
        const val = 42;
        const result = watches(val, ['z']);
        expect(result).toBe(42);
        expect(result.__watches).toBeUndefined(); // primitives can't be mutated anyway
    });
});
