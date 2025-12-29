// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock the parser module before importing the parser
vi.mock('../../../../src/templates/parser.js', () => {
    return {
        parser: {
            registerAttr: vi.fn()
        }
    };
});

// Import the parser file (it will call registerAttr on our mock)
import '../../../../src/templates/parsers/refParser.js';
import { parser } from '../../../../src/templates/parser.js';

describe('#ref parser', () => {
    let refParser;

    beforeAll(() => {
        // Grab the parser object from the call to registerAttr
        expect(parser.registerAttr).toHaveBeenCalledTimes(1);
        refParser = parser.registerAttr.mock.calls[0][0];
        expect(refParser.type).toBe('ref');
    });

    it('match() works correctly', () => {
        const container = document.createElement('div');
        const el = container.appendChild(document.createElement('div'));

        expect(refParser.match(el, { name: '#ref' })).toBe(true);
        expect(refParser.match(el, { name: 'enso-ref' })).toBe(true);
        expect(refParser.match(el, { name: 'other' })).toBe(false);
    });

    it('preprocess() sets def.ref and removes the attribute', () => {
        const container = document.createElement('div');
        container.innerHTML = `<div #ref="myRef"></div>`;
        const el = container.firstElementChild;

        const def = { attachParser: vi.fn() };
        const attr = el.getAttributeNode('#ref');

        const result = refParser.preprocess(def, el, attr);
        expect(result).toBe(true);
        expect(def.ref).toBe('myRef');
        expect(def.attachParser).toHaveBeenCalledWith(refParser);
        expect(el.hasAttribute('#ref')).toBe(false);
    });

    it('process() attaches element to parent.component.refs', () => {
        const def = { ref: 'myRef' };
        const element = document.createElement('div');
        const parent = { component: { refs: {} }, isComponent: true };

        refParser.process(def, parent, element);
        expect(parent.component.refs.myRef).toBe(element);
    });

    it('rejects faulty refs', () => {
        const def = {};
        const element = document.createElement('div');
        const parent = { component: { refs: {} } };

        refParser.process(def, parent, element);
        expect(parent.component.refs.myRef).toBeUndefined();
    });
});
