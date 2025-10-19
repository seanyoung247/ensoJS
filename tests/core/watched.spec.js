
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Watched, getWatched, setWatched } from "../../src/core/watched.js";
import { MARK_CHANGED } from "../../src/core/symbols.js";

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
