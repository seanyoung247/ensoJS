
import { describe, it, expect } from 'vitest';
import { parser } from '../../../../src/templates/parser.js';
import { createNodeDef } from '../../../mockNodeDef.js';
import { getTestElement } from '../../../shared.js';

import attrParser from '../../../../src/templates/parsers/attrParser.js';
attrParser(parser);

describe('attribute mutator parser', () => {

    it('matches :attribute shorthand', () => {
        const el = getTestElement(':class', 'value');

        const attr = el.attributes[0];
        const matched = parser.get('attribute', el, attr);

        expect(matched).toBeDefined();
        expect(matched.type).toBe('attr');
    });

    it('does not match normal attributes', () => {
        const el = getTestElement('class', 'value');

        const attr = el.attributes[0];
        const matched = parser.get('attribute', el, attr);

        expect(matched).toBeNull();
    });

    it('preprocess registers an attribute mutator and consumes attribute', () => {
        const el = getTestElement(':class', '{{ watched:name }}');
        const attr = el.attributes[0];

        const def = createNodeDef(el);
        const parserImpl = parser.get('attribute', el, attr);

        const parsed = parserImpl.preprocess(def, el, attr);
        expect(parsed).toBe(true);

        expect(el.hasAttribute(':class')).toBe(false);

        const mutators = [...def.mutators()];
        expect(mutators.length).toBe(1);

        const [, dataList] = mutators[0];
        expect(dataList.length).toBe(1);
    });

    it('supports multiple attribute bindings on the same node', () => {
        const el = document.createElement('div');
        el.innerHTML = `
            <div
                :class="{{ watched:name }}"
                :data-active="{{ watched:active }}"
            ></div>
        `;

        const node = el.firstElementChild;

        const def = createNodeDef(node);

        for (const attr of [...node.attributes]) {
            const p = parser.get('attribute', node, attr);
            if (p) p.preprocess(def, node, attr);
        }

        const [, dataList] = [...def.mutators()][0];
        expect(dataList.length).toBe(2);
    });

});
