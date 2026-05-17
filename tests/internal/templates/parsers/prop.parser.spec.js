
import { describe, it, expect } from 'vitest';
import { register, ctx, parser } from '../../../../src/templates/parser.js';
import { createNodeDef } from '../../../mockNodeDef.js';
import { getTestElement } from '../../../shared.js';

import propParser from '../../../../src/templates/parsers/propParser.js'
propParser(register, ctx);


describe('property mutator parser', () => {

    it('matches .prop shorthand', () => {
        const el = getTestElement('.name', 'value');

        const attr = el.attributes[0];
        const matched = parser.get('attribute', el, attr);
        
        expect(matched).toBeDefined();
        expect(matched.type).toBe('enso:prop');
    });

    it('preprocesses, registers, and removes attribute', () => {
        const el = getTestElement('.name', '{{ @:name }}');
        const attr = el.attributes[0];

        const def = createNodeDef(el);
        const parserImpl = parser.get('attribute', el, attr);

        const parsed = parserImpl.preprocess(def, el, attr);
        expect(parsed).toBe(true);
        expect(el.hasAttribute('.name')).toBe(false);

        const mutators = [...def.mutators()];
        expect(mutators.length).toBe(1);
        const [, dataList] = mutators[0];
        expect(dataList.length).toBe(1);
    });

});
