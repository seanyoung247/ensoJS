// tests/components.spec.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createComponent,
  Watched, getWatched, setWatched,
  markChanged, update,
} from "../../src/core/components.js";
import { runEffect } from "../../src/core/effects.js";
import {
  UPDATE, MARK_CHANGED,
  GET_BINDING, TASK_LIST,
  SCHEDULE_EFFECT, SCHEDULE_UPDATE,
  ENSO_INTERNAL, CHILDREN, BINDINGS,
} from "../../src/core/symbols.js";

vi.mock("../../src/core/effects.js", () => ({
  runEffect: vi.fn(),
}));

describe("createComponent", () => {
  it("creates a derived class with ENSO_INTERNAL constructor", () => {
    class Base {
      constructor(x) {
        this.arg = x;
      }
    }
    const Derived = createComponent(Base);
    const inst = new Derived();
    expect(inst.arg).toBe(ENSO_INTERNAL);
  });

  it("applies mixin properties", () => {
    class Base {}
    const mixin = { foo() {}, bar: 123 };
    const Derived = createComponent(Base, mixin);
    expect(Derived.prototype.foo).toBeTypeOf("function");
    expect(Derived.prototype.bar).toBe(123);
  });

  it("throws if proto is not an object", () => {
    class Base {}
    expect(() => createComponent(Base, 5)).toThrow(/object litteral/);
  });
});

describe("Watched class", () => {
  let component, observedAttributes;

  beforeEach(() => {
    // Define the watched class properly
    const [MyWatched, attr] = Watched.define({
      count: 5,
      show: { value: true },
      attr: { value: 'test', attribute: { force: true } }
    });
    observedAttributes = attr;

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
    expect(component.onPropertyChange).toHaveBeenCalledWith("count", 10);
  });

  it("setWatched updates multiple values at once", () => {
    setWatched(component, { count: 20, show: false });
    const values = getWatched(component);
    expect(values.count).toBe(20);
    expect(values.show).toBe(false);
    expect(component[MARK_CHANGED]).toHaveBeenCalledWith("count");
    expect(component[MARK_CHANGED]).toHaveBeenCalledWith("show");
  });
});

describe("markChanged", () => {
  let owner, child;

  beforeEach(() => {
    child = { [MARK_CHANGED]: vi.fn() };
    owner = {
      [CHILDREN]: [child],
      [GET_BINDING]: vi.fn(),
      [SCHEDULE_EFFECT]: vi.fn(),
      [SCHEDULE_UPDATE]: vi.fn(),
    };
  });

  it("marks changed binding and schedules effects + update", () => {
    const effect = {};
    const binding = { changed: false, effects: [effect] };
    owner[GET_BINDING].mockReturnValue(binding);
    markChanged(owner, "prop");
    expect(binding.changed).toBe(true);
    expect(owner[SCHEDULE_EFFECT]).toHaveBeenCalledWith(effect);
    expect(owner[SCHEDULE_UPDATE]).toHaveBeenCalled();
    expect(child[MARK_CHANGED]).toHaveBeenCalledWith("prop");
  });

  it("handles missing binding gracefully", () => {
    owner[GET_BINDING].mockReturnValue(undefined);
    expect(() => markChanged(owner, "prop")).not.toThrow();
    expect(child[MARK_CHANGED]).toHaveBeenCalledWith("prop");
  });
});

describe("update", () => {
  let owner, child;

  beforeEach(() => {
    child = { [UPDATE]: vi.fn() };
    owner = {
      [TASK_LIST]: new Set([{}]),
      [BINDINGS]: new Map([["x", { changed: true }]]),
      [CHILDREN]: [child],
    };
  });

  it("runs effects, resets bindings, and updates children", () => {
    update(owner);
    expect(runEffect).toHaveBeenCalled();
    expect([...owner[TASK_LIST]]).toEqual([]);
    expect([...owner[BINDINGS].values()][0].changed).toBe(false);
    expect(child[UPDATE]).toHaveBeenCalled();
  });

  it("handles empty children safely", () => {
    owner[CHILDREN] = [];
    expect(() => update(owner)).not.toThrow();
  });
});
