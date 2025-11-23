
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect } from 'vitest';
import { parseFor, createForFunction } from "../../../src/templates/parsers/forUtils.js";

describe("parseFor()", () => {

    it("parses simple identifiers", () => {
        expect(parseFor("x of list")).toEqual(["x"]);
    });

    it("parses destructuring", () => {
        expect(parseFor("{ a, b } of list")).toEqual(["a","b"]);
    });

    it("parses alias destructuring", () => {
        expect(parseFor("{ a: id1, b: id2 } of list")).toEqual(["id1","id2"]);
    });

    it("parses nested destructuring", () => {
        expect(parseFor("{ [y], a: {b}, c: [d], {x} } of list")).toEqual(["y", "b","d", "x"]);
    });
    
    it("parses array destructuring", () => {      
        expect(parseFor("[x, y, {a, b}, [c]] of list")).toEqual(["x", "y", "a", "b", "c"]);
    });

    it("parses destructuring with default values", () => {
        expect(parseFor("{ a = 5, b: c = 10 } of list")).toEqual(["a", "c"]);
    });

    it("parses complex destructuring", () => {
        expect(parseFor("{ a: { b: [x, y = 2] }, c: { d } } of list")).toEqual(["x", "y", "d"]);
    });

    it("throws on mismatched brackets", () => {
        expect(() => parseFor("{ a, b ] of list")).toThrow('mismatched brackets');
        expect(() => parseFor("[ x, { y, z } of list")).toThrow('mismatched brackets');
    });
});

describe("createForFunction()", () => {

    it("creates a generator function source", () => {
        const fn = createForFunction("x of list", ["x"]);
        expect(fn).toContain("function*");
        expect(fn).toContain("for (const x of list)");
        expect(fn).toContain("yield { x }");
    });

});