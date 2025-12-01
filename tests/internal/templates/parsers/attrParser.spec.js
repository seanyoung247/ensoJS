
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('../../../../src/templates/parser.js', () => {
    return {
        parser: {
            registerAttr: vi.fn()
        }
    };
});

vi.mock('../../../../src/templates/parsers/utils.js', () => ({
    bindSource: vi.fn(value => value),
    getName: vi.fn(attr => attr.name.slice(1)),
    isAttr: vi.fn((attr, prefix) => attr.name.startsWith(prefix)),
    addBinding: vi.fn()
}));

vi.mock('../../../../src/core/effects.js', () => {
    return {
        compileValue: vi.fn(value => `(()=>parse\`${value.replaceAll('{{', '${').replaceAll('}}', '}').trim()}\`)`),
        Action: class {
            constructor(source) {
                this.source = source;
                this.createFunc = vi.fn(() => () => {});
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

import '../../../../src/templates/parsers/attrParser.js';
import { parser } from '../../../../src/templates/parser.js';
import { bindSource, getName, isAttr } from '../../../../src/templates/parsers/utils.js';
import { addBinding } from '../../../../src/templates/parsers/utils.js';
import { getTestElement } from "../../../shared.js";

describe(':attr parser', () => {
    let attrParser;

    beforeAll(() => {
        // Grab the parser object from the call to registerAttr
        expect(parser.registerAttr).toHaveBeenCalledTimes(1);
        attrParser = parser.registerAttr.mock.calls[0][0];
        expect(attrParser.type).toBe('attr');
    });

    it('match() works correctly', () => {
        const el = document.createElement('div');
        expect(attrParser.match(el, { name: ':style' })).toBe(true);
        expect(isAttr).toHaveBeenCalledWith({ name: ':style' }, ':', 'attr');
    });

    it('preprocess() adds an effect and removes the attribute', () => {
        const container = document.createElement('div');
        container.innerHTML = `<div :style="color:{{ '#ff0000' }};"></div>`;
        const el = getTestElement(':style', 'color:{{ "#ff0000" }};');
        const attr = el.getAttributeNode(':style');

        const def = { addAttribute: vi.fn(), attachParser: vi.fn() };

        const result = attrParser.preprocess(def, el, attr);

        expect(result).toBe(true);
        expect(bindSource).toHaveBeenCalledWith(attr.value, expect.any(Set));
        expect(getName).toHaveBeenCalledWith(attr);
        expect(def.addAttribute).toHaveBeenCalled();
        expect(def.attachParser).toHaveBeenCalledWith(attrParser);
        expect(el.hasAttribute(':style')).toBe(false);
    });

    it('process() creates effects and registers bindings', () => {
        const parent = { component: {} };
        const element = document.createElement('div');

        // mock effect instance
        const fakeEffect = { run: vi.fn() };

        // action.createEffect → returns fakeEffect
        const action = {
            createEffect: vi.fn(() => fakeEffect)
        };

        // each attribute:
        const attr1 = {
            action,
            binds: new Set(['a', 'b'])
        };

        const attr2 = {
            action,
            binds: new Set(['x'])
        };

        const def = {
            attributes: [attr1, attr2]
        };

        attrParser.process(def, parent, element);

        // createEffect must be called once per attribute
        expect(action.createEffect).toHaveBeenCalledTimes(2);
        expect(action.createEffect).toHaveBeenCalledWith(parent, element);

        // addBinding must be called for each binding
        expect(addBinding).toHaveBeenCalledTimes(3);

        expect(addBinding).toHaveBeenCalledWith(parent, 'a', fakeEffect);
        expect(addBinding).toHaveBeenCalledWith(parent, 'b', fakeEffect);
        expect(addBinding).toHaveBeenCalledWith(parent, 'x', fakeEffect);
    });

    it('deals with bad input without throwing', () => {
        expect(() => attrParser.process({}, null, null)).not.toThrow();
    });
});
