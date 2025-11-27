
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";

// Mock parser
vi.mock("../../../src/templates/parser.js", () => ({
    parser: { registerNode: vi.fn() }
}));

// Mock utils
vi.mock("../../../src/templates/parsers/utils.js", () => ({
    getDirective: vi.fn((node) => node.getAttribute('*if') || node.getAttribute('enso-if')),
    bindSource: vi.fn((src, binds) => {
        binds.add("x");
        return src;
    }),
    addBinding: vi.fn()
}));

// Mock Action & compileValue
vi.mock("../../../src/core/effects.js", () => {
    return {
        compileValue: vi.fn(src => `compiled(${src})`),

        Action: class {
            constructor(source) { this.source = source; }
            createEffect = vi.fn((parent, el) => ({
                parent, el, source: this.source
            }));
        }
    };
});

// Mock EnsoFragment
vi.mock("../../../src/core/fragment.js", () => {
    return {
        EnsoFragment: class {
            constructor(parent, template, placeholder) {
                this.parent = parent;
                this.template = template;
                this.placeholder = placeholder;
            }
            mount() {}
            unmount() {}
        }
    };
});

// load the parser module
import "../../../src/templates/parsers/ifParser.js";

import { parser } from "../../../src/templates/parser.js";
import { getDirective, bindSource, addBinding } from "../../../src/templates/parsers/utils.js";
import { getTestElement } from "../../shared.js";


describe("If Parser", () => {
    let ifParser;

    beforeAll(() => {
        expect(parser.registerNode).toHaveBeenCalledTimes(1);
        ifParser = parser.registerNode.mock.calls[0][0];
        expect(ifParser.type).toBe("if");
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => vi.restoreAllMocks());

    it("match() identifies elements with *if or enso-if", () => {
        const n1 = getTestElement("*if", "x");
        expect(ifParser.match(n1)).toBe(true);

        const n2 = getTestElement("enso-if", "x");
        expect(ifParser.match(n2)).toBe(true);

        const n3 = document.createElement("div");
        expect(ifParser.match(n3)).toBe(false);
    });

    it("preprocess() stores directive and attaches parser", () => {
        const el = getTestElement("*if", "x > 0");

        const def = {
            directive: null,
            map: {
                createRoot: vi.fn(() => ({
                    setDirective: vi.fn(),
                    attachParser: vi.fn()
                }))
            }
        };

        const ok = ifParser.preprocess(def, el);
        expect(ok).toBe(true);

        expect(getDirective).toHaveBeenCalled();
        expect(bindSource).toHaveBeenCalled();

        const rootDef = def.map.createRoot.mock.results[0].value;

        expect(rootDef.setDirective).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "if",
                action: expect.any(Object),
                binds: expect.any(Set)
            })
        );
        expect(rootDef.attachParser).toHaveBeenCalledWith(ifParser);
    });

    it("preprocess() skips if directive already set", () => {
        const el = getTestElement("*if", "x > 0");

        const def = {
            directive: { type: "if" }
        };

        const ok = ifParser.preprocess(def, el);
        expect(ok).toBe(false);
    });

    it("process() creates IfFragment and registers bindings", () => {
        const el = document.createElement("div");

        const directive = {
            type: "if",
            action: { createEffect: vi.fn(() => ({ eff: true })) },
            binds: new Set(["x"]),
            template: document.createElement('template')
        };

        const def = { directive };

        const parent = {};

        ifParser.process(def, parent, el);

        expect(directive.action.createEffect).toHaveBeenCalledWith(parent, null);

        expect(addBinding).toHaveBeenCalledWith(
            parent,
            "x",
            expect.objectContaining({ run: expect.any(Function) })
        );
    });
});
