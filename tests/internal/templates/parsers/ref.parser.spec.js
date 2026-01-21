import { describe, it, expect, vi } from 'vitest';
import { parser } from '../../../../src/templates/parser.js';
import { createNodeDef } from '../../../mockNodeDef.js';
import { createMockComponent } from '../../../mockComponent.js';
import { getTestElement } from '../../../shared.js';

import refParser from '../../../../src/templates/parsers/refParser.js';
refParser(parser);


describe('ref operator parser', () => {

    it('matches elements with #ref shorthand', () => {
        const el = getTestElement('#ref', 'myRef');

        const op = parser.getGeneratorParser(el);
        expect(op).toBeDefined();
        expect(op.type).toBe('ref');
    });

    it('matches elements with enso-ref longhand', () => {
        const el = getTestElement('enso-ref', 'myRef');

        const op = parser.getGeneratorParser(el);
        expect(op).toBeDefined();
        expect(op.type).toBe('ref');
    });

    it('preprocess extracts ref name, consumes attribute, and marks watched', () => {
        const el = getTestElement('#ref', 'myRef');
        const def = createNodeDef(el);
        const op = parser.getGeneratorParser(el);

        const result = op.preprocess(def, el);

        expect(result).toBe(true);

        const operator = def.getOperator();
        expect(operator).toBeDefined();
        expect(operator.data).toEqual({
            type: 'ref',
            name: 'myRef'
        });

        // attribute consumed
        expect(el.hasAttribute('#ref')).toBe(false);
        expect(el.hasAttribute('enso-ref')).toBe(false);

        // ref must be watched
        expect(el.hasAttribute('data-enso-node')).toBe(true);
    });

    it('process attaches ref to component instance', () => {
        const el = getTestElement('#ref', 'myRef');
        const def = createNodeDef(el);
        const op = parser.getGeneratorParser(el);

        op.preprocess(def, el);

        const parent = createMockComponent();
        op.process(def.getOperator().data, parent, el);

        expect(parent.component.refs.myRef).toBe(el);
    });

    it('warns and does not attach ref if parent is not a component', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const el = getTestElement('#ref', 'myRef');
        const def = createNodeDef(el);
        const op = parser.getGeneratorParser(el);

        op.preprocess(def, el);

        const parent = { isComponent: false };
        op.process(def.getOperator().data, parent, el);

        expect(warn).toHaveBeenCalled();
        expect(parent.component).toBeUndefined();
    });

    it('does not preprocess if operator already exists', () => {
        const el = getTestElement('#ref', 'myRef');
        const def = createNodeDef(el);

        const op = parser.getGeneratorParser(el);

        // Fake an existing operator
        def.setOperator(op, { type: 'if' });

        const result = op.preprocess(def, el);
        expect(result).toBe(false);
    });

    it('process does nothing if data is invalid', () => {
        const el = getTestElement('#ref', 'true');
        const parent = createMockComponent();

        const op = parser.getGeneratorParser(el);

        expect(() => {
            op.process(null, parent, el);
            op.process({ type: 'nope' }, parent, el);
        }).not.toThrow();
    });

});
