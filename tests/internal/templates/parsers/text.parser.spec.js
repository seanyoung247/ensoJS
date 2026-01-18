import { describe, it, expect } from 'vitest';
import { parser } from '../../../../src/templates/parser.js';
import { createNodeDef } from '../../../mockNodeDef.js';
import { getTestElement } from '../../../shared.js';

import '../../../../src/templates/parsers/textParser.js';

const getTextNode = (el) =>
    [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE);

describe('text mutator parser', () => {

    it('matches text nodes containing interpolation', () => {
        const el = getTestElement('', '');
        el.innerHTML = 'Hello {{ value }}';

        const textNode = getTextNode(el);
        const def = createNodeDef(textNode);

        const parsed = parser.preprocess(def, textNode);
        expect(parsed).toBe(true);
    });

    it('does not match plain text nodes', () => {
        const el = getTestElement('', '');
        el.innerHTML = 'Hello world';

        const textNode = getTextNode(el);
        const def = createNodeDef(textNode);

        const parsed = parser.preprocess(def, textNode);
        expect(parsed).toBe(false);
    });

    it('adds a text mutator to the NodeDef', () => {
        const el = getTestElement('', '');
        el.innerHTML = 'Hello {{ value }}';

        const textNode = getTextNode(el);
        const def = createNodeDef(textNode);

        parser.preprocess(def, textNode);

        const mutators = [...def.mutators()];
        expect(mutators.length).toBe(1);

        const [parserImpl, dataList] = mutators[0];
        expect(parserImpl).toBeDefined();
        expect(Array.isArray(dataList)).toBe(true);
        expect(dataList.length).toBe(1);

        const data = dataList[0];
        expect(data).toHaveProperty('action');
        expect(data).toHaveProperty('binds');
        expect(data.binds.size).toBeGreaterThan(0);
    });

    it('marks the parent element as watched', () => {
        const el = getTestElement('', '');
        el.innerHTML = 'Hello {{ value }}';

        const textNode = getTextNode(el);
        const def = createNodeDef(textNode);

        parser.preprocess(def, textNode);

        expect(el.hasAttribute('data-enso-node')).toBe(true);
    });

    it('ignores non-text nodes', () => {
        const el = getTestElement('', '');
        const def = createNodeDef(el);

        const parsed = parser.preprocess(def, el);
        expect(parsed).toBe(false);
    });

});
