
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect, vi, beforeAll } from "vitest";
import { ROOT, CHILDREN, ANCHOR } from "../../../src/core/symbols.js";

vi.mock('../../../src/templates/parser.js', () => ({
    parser: { registerNode: vi.fn() }
}));

vi.mock('../../../src/templates/parsers/utils.js', () => ({
    bindSource: vi.fn(value => value),
    addBinding: vi.fn(),
    getDirective: vi.fn(node => node.getAttribute('*for'))
}));

vi.mock('../../../src/core/effects.js', () => ({
    Action: class {
        constructor(source) {
            this.source = source;
            this.createEffect = vi.fn(() => ({ run: () => ['a','b'] }));
        }
    }
}));

vi.mock('../../../src/core/fragment.js', () => ({
    EnsoFragment: class { 
        constructor() { 
            this[ROOT]=document.createElement('template');
            this[CHILDREN]=[]; 
            this[ANCHOR]=document.createElement('div');
        }
    }
}));

import '../../../src/templates/parsers/forParser.js';
import { parser } from '../../../src/templates/parser.js';
import { addBinding, bindSource } from '../../../src/templates/parsers/utils.js';
import { Action } from '../../../src/core/effects.js';
import { getTestElement } from "../../shared.js";

describe("For Parser", () => {
    let forParser;
    beforeAll(() => {
        expect(parser.registerNode).toHaveBeenCalledTimes(1);
        forParser = parser.registerNode.mock.calls[0][0];
        expect(forParser.type).toBe('for');
    });

    it('match() identifies *for attribute', () => {
        const el = getTestElement('*for', 'item of list');
        expect(forParser.match(el)).toBe(true);

        const noEl = document.createElement('div');
        expect(forParser.match(noEl)).toBe(false);
    });

    it('preprocess() registers for directive', () => {
        const el = getTestElement('*for', 'item of list');

        const def = { map: { createRoot: vi.fn(() => ({ 
            setDirective: vi.fn(), 
            attachParser: vi.fn() 
        })) } };
        const result = forParser.preprocess(def, el);

        expect(result).toBe(true);
        expect(bindSource).toHaveBeenCalled();
        expect(def.map.createRoot).toHaveBeenCalledWith(el);
    });

    it("preprocess() skips if directive already set", () => {
        const el = getTestElement("*for", "item of list");

        const def = {
            directive: { type: "for" }
        };

        const ok = forParser.preprocess(def, el);
        expect(ok).toBe(false);
    });

    it('process() creates ForFragment and registers bindings', () => {
        const def = {
            directive: {
                type: 'for',
                action: new Action('item of list'),
                binds: ['item'],
                template: document.createElement('template')
            }
        };

        const parent = {};
        const el = document.createElement('div');

        forParser.process(def, parent, el);

        expect(def.directive.action.createEffect).toHaveBeenCalledWith(
            parent, null
        );
        expect(addBinding).toHaveBeenCalledWith(
            parent, 'item', 
            expect.objectContaining(
                { run: expect.any(Function) }
            )
        );
    });
});