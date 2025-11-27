// components.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createComponent, EnsoNode } from "../../src/core/components.js";
import {
    MARK_CHANGED, ADD_BINDING, BINDINGS,
    TASK_LIST, SCHEDULE_UPDATE, UPDATE,
    ENSO_INTERNAL, CHILDREN, ADD_CHILD
} from "../../src/core/symbols.js";

describe("createComponent()", () => {

    class Base {
        constructor(key) {
            if (key !== ENSO_INTERNAL) {
                throw new Error("Direct subclassing not allowed");
            }
        }
    }

    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it("creates a class extending the base", () => {
        const C = createComponent(Base);
        const inst = new C();
        expect(inst).toBeInstanceOf(C);
        expect(inst).toBeInstanceOf(Base);
    });

    it("throws if proto is not an object literal", () => {
        expect(() => createComponent(Base, 123)).toThrow(/object litteral/);
        expect(() => createComponent(Base, "x")).toThrow();
    });

    it("mixes object literal properties into prototype", () => {
        const proto = {
            x: 10,
            doThing() { return 99; }
        };

        const C = createComponent(Base, proto);
        const inst = new C();

        expect(inst.x).toBe(10);
        expect(inst.doThing()).toBe(99);
    });

    it("preserves property descriptors (getters/setters)", () => {
        let val = 0;
        const C = createComponent(Base, {
            get value() { return val; },
            set value(v) { val = v * 2; }
        });

        const inst = new C();
        inst.value = 5;
        expect(val).toBe(10);
        expect(inst.value).toBe(10);
    });
});

describe("EnsoNode", () => {

    let Node, instance;

    beforeEach(() => {
        Node = EnsoNode(); // default Base=Object
        instance = new Node();

        // Mock bindings map
        instance[BINDINGS] = new Map();

        // Mock SCHEDULE_UPDATE so we can detect calls
        instance[SCHEDULE_UPDATE] = vi.fn();
    });


    it("initialises binding, children, and task list", () => {
        expect(instance[BINDINGS]).toBeInstanceOf(Map);
        expect(instance[TASK_LIST]).toBeInstanceOf(Set);
        expect(instance[CHILDREN]).toEqual([]);
    });


    it("ADD_BINDING adds effect to existing binding", () => {
        const effect = { run: vi.fn() };
        instance[BINDINGS].set("x", { effects: [], changed: false });

        instance[ADD_BINDING]("x", effect);

        const bind = instance[BINDINGS].get("x");
        expect(bind.effects).toContain(effect);
        expect(bind.changed).toBe(true);
    });


    it("MARK_CHANGED marks binding changed and schedules effects", () => {
        const effect1 = { run: vi.fn() };
        const effect2 = { run: vi.fn() };

        instance[BINDINGS].set("x", {
            changed: false,
            effects: [effect1, effect2]
        });

        instance[MARK_CHANGED]("x");

        const bind = instance[BINDINGS].get("x");
        expect(bind.changed).toBe(true);

        // Effects scheduled
        expect(instance[TASK_LIST].has(effect1)).toBe(true);
        expect(instance[TASK_LIST].has(effect2)).toBe(true);

        // Update scheduled
        expect(instance[SCHEDULE_UPDATE]).toHaveBeenCalled();
    });


    it("MARK_CHANGED propagates to children", () => {
        const child = new Node();
        child[BINDINGS] = new Map();
        child[SCHEDULE_UPDATE] = vi.fn();

        child[BINDINGS].set("y", { changed: false, effects: [] });
        instance[ADD_CHILD](child);

        instance[MARK_CHANGED]("y");

        const bind = child[BINDINGS].get("y");
        expect(bind.changed).toBe(true);
    });


    it("UPDATE runs effects once then clears task list", () => {
        const effect1 = { run: vi.fn() };
        const effect2 = { run: vi.fn() };

        instance[TASK_LIST].add(effect1);
        instance[TASK_LIST].add(effect2);

        instance[BINDINGS].set("x", { changed: true, effects: [] });

        instance[UPDATE]();

        expect(effect1.run).toHaveBeenCalledTimes(1);
        expect(effect2.run).toHaveBeenCalledTimes(1);

        expect(instance[TASK_LIST].size).toBe(0);
    });


    it("UPDATE resets changed flags", () => {
        instance[BINDINGS].set("a", { changed: true, effects: [] });
        instance[BINDINGS].set("b", { changed: true, effects: [] });

        instance[UPDATE]();

        expect(instance[BINDINGS].get("a").changed).toBe(false);
        expect(instance[BINDINGS].get("b").changed).toBe(false);
    });


    it("UPDATE recursively updates children", () => {
        const child = new Node();
        child[BINDINGS] = new Map();
        child[TASK_LIST].add({ run: vi.fn() });

        const childUpdateSpy = vi.spyOn(child, UPDATE);

        instance[ADD_CHILD](child);

        instance[UPDATE]();

        expect(childUpdateSpy).toHaveBeenCalled();
    });


    it("ADD_CHILD stores children", () => {
        const child = new Node();
        instance[ADD_CHILD](child);
        expect(instance[CHILDREN]).toContain(child);
    });

});

