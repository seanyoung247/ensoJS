
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

// Mock parser.js — capture registerNode
vi.mock('../../../../src/templates/parser.js', () => {
    return {
        parser: {
            registerNode: vi.fn()
        }
    };
});

// Mock utils.js
vi.mock('../../../../src/templates/parsers/utils.js', () => ({
    bindSource: vi.fn((value, ) => value),
    addBinding: vi.fn()
}));

// dom utils
vi.mock('../../../../src/utils/dom.js', () => ({
    getChildIndex: vi.fn((parent, node) =>
        Array.prototype.indexOf.call(parent.childNodes, node)
    )
}));

// effects.js
vi.mock('../../../../src/core/effects.js', () => {
    return {
        compileValue: vi.fn(src => `compiled(${src})`),

        Action: class {
            constructor(source, data, EffectClass) {
                this.source = source;
                this.data = data;
                this.EffectClass = EffectClass;
                this.createEffect = (parent, el) =>
                    new this.EffectClass(parent, el, this);
            }
        },

        Effect: class {
            constructor(parent, element, action) {
                this.parent = parent;
                this.element = element;
                this.action = action;
            }
            run() {
                return this.action.source;
            }
        }
    };
});

import '../../../../src/templates/parsers/textParser.js';

import { parser } from '../../../../src/templates/parser.js';
import { bindSource, addBinding } from '../../../../src/templates/parsers/utils.js';
import { getChildIndex } from '../../../../src/utils/dom.js';


describe('Text Parser', () => {
    let textParser;

    beforeAll(() => {
        expect(parser.registerNode).toHaveBeenCalledTimes(1);
        textParser = parser.registerNode.mock.calls[0][0];
        expect(textParser.type).toBe('text');
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // --- match() ---
    it('match() identifies text nodes with {{ }} interpolation', () => {
        const node = document.createTextNode('Hello {{name}}!');
        expect(textParser.match(node)).toBe(true);

        const noMatch = document.createTextNode('just plain text');
        expect(textParser.match(noMatch)).toBe(false);
    });

    // --- preprocess() ---
    it('preprocess() registers content with bindings', () => {
        const container = document.createElement('div');
        container.innerHTML = 'Hello {{world}}!';
        const textNode = container.firstChild;

        const def = {
            addContent: vi.fn(),
            attachParser: vi.fn()
        };

        const result = textParser.preprocess(def, textNode);

        expect(result).toBe(true);

        expect(bindSource).toHaveBeenCalled();
        expect(getChildIndex).toHaveBeenCalled();

        expect(def.addContent).toHaveBeenCalledWith(
            container,
            0,                               // child index
            expect.any(Object),              // Action instance
            expect.any(Set)                  // binds
        );

        expect(def.attachParser).toHaveBeenCalledWith(textParser);
    });

    // --- process() ---
    it('process() creates effects and binds them', () => {
        const container = document.createElement('div');
        container.innerHTML = 'Value: {{x}}';
        const textNode = container.firstChild;

        const action = {
            createEffect: vi.fn((parent, el) => ({
                dummy: true,
                parent, el
            }))
        };

        const binds = new Set(['x']);

        const def = {
            content: [{
                index: 0,
                action: action,
                binds: binds
            }]
        };

        const parent = { component: {}, bindings: {} };

        textParser.process(def, parent, container);

        // Effect created
        expect(action.createEffect).toHaveBeenCalledWith(parent, textNode);

        // Binds applied
        expect(addBinding).toHaveBeenCalledWith(
            parent,
            'x',
            expect.objectContaining({ dummy: true })
        );
    });

    it('deals with bad input without throwing', () => {
        expect(() => textParser.process({}, null, null)).not.toThrow();
    });
});
