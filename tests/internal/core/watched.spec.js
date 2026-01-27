
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Watched, 
  prop, attr, computed,
  getWatched, setWatched,
} from "../../../src/core/watched.js";
import { BINDINGS, MARK_CHANGED } from "../../../src/core/symbols.js";
import { lifecycle } from "../../../src/component.js";

describe("Watched class", () => {
    let component, observedAttributes;

    beforeEach(() => {
        // Define the watched class properly
        const MyWatched = Watched.define({
            count: 5,
            show: prop(true),
            attr: attr('test'),
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

    it("Doesn't allow illegal property names", () => {
        expect(()=>Watched.define({ _illegal: 5})).toThrow();
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

        component.watched._update({ count: 10 });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
            component.watched._defs.count,
            10
        );
    });

    it('does nothing when the value has not changed', () => {
        const spy = vi.spyOn(component.watched, '_setProp');

        // count starts as 5 from the definition
        component.watched._update({ count: 5 });

        expect(spy).not.toHaveBeenCalled();
    });

    it('computed properties deal with bad input', () => {
        expect(() => {
            Watched.define({
                comp: computed(123, [])
            });
        }).toThrow();
        expect(() => {
            Watched.define({
                comp: computed(vi.fn())
            });
        }).toThrow();
        expect(() => {
            Watched.define({
                comp: computed(vi.fn(), {})
            });
        }).toThrow();
    });

    it("does nothing if dependency doesn't exist", () => {
        expect(() => {
            Watched.define({
                comp: computed(vi.fn, ['unknown'])
            });
        }).not.toThrow();
    });

    it("doesn't duplicate lifecycle bindings", () => {
        const comp = computed(function(){}, [lifecycle.mount]);
        expect(comp.deps.length).toBe(1);
    });

    it('can add watchers', () => {
        const component = {}; // dummy
        const watched = new Watched(component);
        const spy = vi.fn();

        watched[BINDINGS]['prop'] = {
            changed: false,
            watchers: [],
            effects: []
        };
        watched._addWatcher('prop', spy);
        watched._notify('prop');

        expect(spy).toBeCalled();
    });

    it('does nothing when adding to an unknown prop', () => {
        const component = {}; // dummy
        const watched = new Watched(component);
        const spy = vi.fn();

        watched._addWatcher('unknown', spy);
        watched._notify('unknown');

        expect(spy).not.toBeCalled();
    });

    it('does nothing when notifying an unknown prop', () => {
        const component = {}; // dummy
        const watched = new Watched(component);

        const spy = vi.fn();
        watched[BINDINGS]['known'] = {
            changed: false,
            watchers: [spy],
            effects: []
        };

        // Ensure 'missing' is truly missing
        expect(watched[BINDINGS]['missing']).toBeUndefined();

        // Act: notify a property with no watchers
        watched._notify('missing');

        // Assert: no watchers were called
        expect(spy).not.toHaveBeenCalled();
    });
});
