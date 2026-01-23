
import { describe, it, expect, vi } from 'vitest';
import { parser } from '../../../../src/templates/parser.js';
import { createNodeDef } from '../../../mockNodeDef.js';
import { getTestElement } from '../../../shared.js';

import eventParser from '../../../../src/templates/parsers/eventParser.js';
eventParser(parser);


const silenceConsole = () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn  = vi.spyOn(console, 'warn').mockImplementation(() => {});
    return () => {
        error.mockRestore();
        warn.mockRestore();
    };
};


describe('event mutator parser', () => {

    it('matches @event shorthand', () => {
        const el = getTestElement('@click', 'handler');

        const attr = el.attributes[0];
        const matched = parser.get('attribute', el, attr);

        expect(matched).toBeDefined();
        expect(matched.type).toBe('event');
    });

    it('does not match normal attributes', () => {
        const el = getTestElement('class', 'value');

        const attr = el.attributes[0];
        const matched = parser.get('attribute', el, attr);

        expect(matched).toBeNull();
    });

    it('preprocess registers an event mutator and consumes attribute', () => {
        const el = getTestElement('@click', 'handler');
        const attr = el.attributes[0];

        const def = createNodeDef(el);
        const parserImpl = parser.get('attribute', el, attr);

        const parsed = parserImpl.preprocess(def, el, attr);
        expect(parsed).toBe(true);

        // Attribute must be removed
        expect(el.hasAttribute('@click')).toBe(false);

        // Mutator must be registered
        const mutators = [...def.mutators()];
        expect(mutators.length).toBe(1);

        const [, dataList] = mutators[0];
        expect(dataList.length).toBe(1);

        const data = dataList[0];
        expect(data).toHaveProperty('name', 'click');
        expect(data).toHaveProperty('action');
    });

    it('process attaches an event listener', () => {
        const restore = silenceConsole();

        const el = getTestElement('@click', '()=>console.log("handler")');
        const attr = el.attributes[0];
        const def = createNodeDef(el);

        const parserImpl = parser.get('attribute', el, attr);
        parserImpl.preprocess(def, el, attr);

        const [, dataList] = [...def.mutators()][0];

        const spy = vi.spyOn(el, 'addEventListener');
        const parent = { component: {} };

        parserImpl.process(dataList, parent, el);

        expect(spy).toHaveBeenCalled();
        restore();
    });

    it('falls back to warning handler on invalid action', () => {
        const restore = silenceConsole();

        const el = getTestElement('@click', '%%%');
        const attr = el.attributes[0];
        const def = createNodeDef(el);

        const parserImpl = parser.get('attribute', el, attr);
        parserImpl.preprocess(def, el, attr);

        const [, dataList] = [...def.mutators()][0];

        expect(() => {
            parserImpl.process(dataList, { component: {} }, el);
        }).not.toThrow();

        restore();
    });

});
