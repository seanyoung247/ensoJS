
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, vi } from "vitest";
import {
    createEffectEnv,
    createStringTemplate,
    // `createEffect` is IIFE with cache closure
    createEffect,
    runEffect,
} from "../../src/core/effects.js";
import { ENV } from "../../src/core/symbols.js";

// Mock parse to verify propagation into environment
vi.mock("../../src/core/tags.js", () => ({
    parse: vi.fn(() => "parsed")
}));

describe("createEffectEnv", () => {
    it("creates a frozen object inheriting from baseEnv", () => {
        const base = { a: 1 };
        const env = createEffectEnv({ b: 2 }, base);
        expect(Object.getPrototypeOf(env)).toBe(base);
        expect(env.b).toBe(2);
        expect(Object.isFrozen(env)).toBe(true);
    });

    it("defaults to rootEnv when not provided", () => {
        const env = createEffectEnv();
        expect(env.parse).toBeTypeOf("function");
        expect(Object.isFrozen(env)).toBe(true);
    });
});

describe("createStringTemplate", () => {
    it("replaces {{}} with ${} and trims whitespace", () => {
        const result = createStringTemplate("  Hello {{name}}!  ");
        expect(result).toBe("parse`Hello ${name}!`");
    });

    it("handles multiple replacements", () => {
        const result = createStringTemplate("{{a}} and {{b}}");
        expect(result).toBe("parse`${a} and ${b}`");
    });
});

describe("createEffect", () => {
    it("creates a new function with parameters", () => {
        const fn = createEffect("x", "y", "x + y");
        const result = fn({}, 2, 3);
        expect(result).toBe(5);
    });

    it("caches identical function bodies", () => {
        const fn1 = createEffect("a", "a");
        const fn2 = createEffect("a", "a"); // identical args -> same cache key
        expect(fn1).toBe(fn2);
    });

    it("works with no parameters", () => {
        const fn = createEffect("42");
        expect(fn({},)).toBe(42);
    });

    it("wraps code in strict env correctly", () => {
        const fn = createEffect("x", "x * 2");
        const res = fn({}, 4);
        expect(res).toBe(8);
    });
});

describe("runEffect", () => {
    it("calls effect.action with correct context and args", () => {
        const action = vi.fn();
        const parent = {
            component: { id: 1 },
            [ENV]: { foo: "bar" }
        };
        const effect = { action };
        runEffect(parent, effect);
        expect(action).toHaveBeenCalledWith(parent[ENV], effect);
        expect(action.mock.instances[0]).toBe(parent.component);
    });

    it("does nothing if effect or action missing", () => {
        const parent = { component: {}, [ENV]: {} };
        expect(() => runEffect(parent, {})).not.toThrow();
        expect(() => runEffect(parent, null)).not.toThrow();
    });
});
