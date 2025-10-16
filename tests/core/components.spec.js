
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    createComponent,
    defineWatchedProperty,
    markChanged,
    update,
} from "../../src/core/components.js";

import { watch } from "../../src/core/watcher.js";
import { runEffect } from "../../src/core/effects.js";
import {
    UPDATE,
    MARK_CHANGED,
    GET_BINDING,
    TASK_LIST,
    SCHEDULE_EFFECT,
    SCHEDULE_UPDATE,
    ENSO_INTERNAL,
    BINDINGS,
    CHILDREN,
} from "../../src/core/symbols.js";

vi.mock("../../src/core/watcher.js", () => ({
    watch: vi.fn((val) => val),
}));

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
        class Base {
            constructor(x) {
                this.arg = x;
            }
        }
        const mixin = { foo: vi.fn(), bar: 123 };
        const Derived = createComponent(Base, mixin);
        expect(Derived.prototype.foo).toBeTypeOf("function");
        expect(Derived.prototype.bar).toBe(123);
    });

    it("throws if proto is not an object", () => {
        class Base {}
        expect(() => createComponent(Base, 5)).toThrow(/object litteral/);
    });
});

describe("defineWatchedProperty", () => {
    let cls;
    beforeEach(() => {
        cls = class {
        constructor() {
            this[MARK_CHANGED] = vi.fn();
            this.reflectAttribute = vi.fn();
            this.onPropertyChange = vi.fn();
        }
        };
    });

    it("defines shallow reactive property", () => {
        defineWatchedProperty(cls, "foo", { value: 10 });
        const inst = new cls();
        inst.foo = 20;
        expect(inst._foo).toBe(20);
        expect(inst[MARK_CHANGED]).toHaveBeenCalledWith("foo");
        expect(inst.onPropertyChange).toHaveBeenCalledWith("foo", 20);
    });

    it("defines deep reactive property", () => {
        defineWatchedProperty(cls, "deep", { deep: true, value: { a: 1 } });
        const inst = new cls();
        // eslint-disable-next-line no-unused-vars
        const val = inst.deep; // triggers getter + watch
        expect(watch).toHaveBeenCalled();
        inst.deep = { a: 2 };
        expect(inst[MARK_CHANGED]).toHaveBeenCalledWith("deep");
    });

    it("handles attributes correctly", () => {
        defineWatchedProperty(cls, "name", {
            attribute: { type: String, force: true },
            value: "x",
        });
        const inst = new cls();
        inst.name = "y";
        expect(inst.reflectAttribute).toHaveBeenCalledWith("name");
    });

    it("throws for unsupported attribute type", () => {
        expect(() =>
        defineWatchedProperty(cls, "bad", { attribute: { type: Map } })
        ).toThrow(/unsupported type/);
    });

    it("handles existing function setter correctly", () => {
        cls.prototype.bar = function (v) {
        this.calledWith = v;
        };
        defineWatchedProperty(cls, "bar", {});
        const inst = new cls();
        inst.bar = 42;
        expect(inst.calledWith).toBe(42);
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
        expect(() => markChanged(owner, "p")).not.toThrow();
        expect(child[MARK_CHANGED]).toHaveBeenCalled();
    });
});

describe("update", () => {
    let owner, child;
    beforeEach(() => {
        child = { [UPDATE]: vi.fn() };
        owner = {
        [TASK_LIST]: new Set([{ id: 1 }]),
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
