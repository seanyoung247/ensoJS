
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
        expect(parseFor("{ a: {b}, c: [d] } of list")).toEqual(["b","d"]);
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