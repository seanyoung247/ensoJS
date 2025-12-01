
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    createEffectEnv, compileValue, Action, Effect
} from "../../../src/core/effects.js";
import { ENV } from "../../../src/core/symbols.js";


export const mockParent = (env = {}) => ({
    component: { name: "mock-component" },
    [ENV]: env
});

export const mockElement = () => ({ tag: "div" });

describe("createEffectEnv()", () => {
    it("creates a frozen object", () => {
        const env = createEffectEnv();
        expect(Object.isFrozen(env)).toBe(true);
    });

    it("inherits from baseEnv", () => {
        const base = { base: 123 };
        const env = createEffectEnv({}, base);
        expect(env.base).toBe(123);
        expect(Object.getPrototypeOf(env)).toBe(base);
    });

    it("adds provided args as own props", () => {
        const env = createEffectEnv({ a: 10 });
        expect(env.a).toBe(10);
        // eslint-disable-next-line no-prototype-builtins
        expect(env.hasOwnProperty("a")).toBe(true);
    });
});

describe("compileValue()", () => {
    it("wraps template into parse-tagged IIFE", () => {
        const out = compileValue("{{a + 1}}");
        expect(out).toContain("()=>parse`");
        expect(out).toContain("${a + 1}");
    });

    it("strips surrounding whitespace", () => {
        const out = compileValue("   {{x}}   ");
        expect(out).toContain("${x}");
    });
});

describe("Action", () => {
    it("stores data and code", () => {
        const act = new Action("1+2", { test: true });
        expect(act.data.test).toBe(true);
        expect(act.code).toBe("1+2");
    });

    it("creates a callable effect function", () => {
        const act = new Action("() => 1 + 2");
        const parent = mockParent();
        const fn = act.createFunc(parent);
        expect(fn()).toBe(3);
    });

    it("executes with env scoping", () => {
        const act = new Action("() => x + 1");
        const parent = mockParent({ x: 10 });

        const fn = act.createFunc(parent);
        expect(fn()).toBe(11);
    });

    it("throws TypeError if created function doesn't return a function", () => {
        const act = new Action("123"); // returns 123, not a function
        const parent = mockParent();

        expect(() => act.createFunc(parent)).toThrow(TypeError);
    });
});

describe("Effect", () => {
    let consoleSpy;
    beforeEach(() => {
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("stores element and action function", () => {
        const act = new Action("() => 42");
        const parent = mockParent();
        const element = mockElement();

        const effect = act.createEffect(parent, element);

        expect(effect.element).toBe(element);
        expect(typeof effect.action).toBe("function");
    });

    it("runs the action", () => {
        const act = new Action("() => 5");
        const parent = mockParent();
        const element = mockElement();

        const effect = act.createEffect(parent, element);
        expect(effect.run()).toBe(5);
    });

    it("handles malformed action code", () => {
        new Action("(} => [}");
        expect(consoleSpy).toHaveBeenCalled();
    });

    it("catches errors and returns undefined", () => {
        const act = new Action("() => { throw new Error('fail'); }");
        const parent = mockParent();
        const element = mockElement();

        const effect = act.createEffect(parent, element);
        expect(effect.run()).toBeUndefined();
    });

    it("handles failure to instantiate effect gracefully", () => {
        const badAction = {
            createFunc() { throw new Error("boom"); }
        };
        const parent = mockParent();
        const element = mockElement();

        const effect = new Effect(parent, element, badAction);
        expect(effect.run()).toBeUndefined();
    });
});