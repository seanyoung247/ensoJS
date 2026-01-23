import { describe, it, expect } from 'vitest';
import { parser } from '../../../../src/templates/parser.js';
import { createNodeDef } from '../../../mockNodeDef.js';
import { getTestElement } from '../../../shared.js';

import forParser from '../../../../src/templates/parsers/forParser.js';
forParser(parser);


describe('for operator parser', () => {

    it('matches *for shorthand', () => {
        const el = getTestElement('*for', 'item of items');

        const op = parser.get('generator', el);
        expect(op).toBeDefined();
        expect(op.type).toBe('for');
    });

    it('matches enso-for longhand', () => {
        const el = getTestElement('enso-for', 'item of items');

        const op = parser.get('generator', el);
        expect(op).toBeDefined();
        expect(op.type).toBe('for');
    });

    it('preprocess consumes attribute and registers operator', () => {
        const el = getTestElement('*for', 'item of items');
        const def = createNodeDef(el);

        const op = parser.get('generator', el);
        const result = op.preprocess(def, el);

        expect(result).toBe(true);

        // attribute removed
        expect(el.hasAttribute('*for')).toBe(false);
        expect(el.hasAttribute('enso-for')).toBe(false);

        // root NodeDef created
        const forDef = def.map.getByRoot(el);
        expect(forDef).not.toBeNull();

        const operator = forDef.getGenerator();
        expect(operator).toBeDefined();
        expect(operator.data.type).toBe('for');
        expect(operator.data.action).toBeDefined();
        expect(operator.data.binds).toBeInstanceOf(Set);
        expect(operator.data.template).toBeNull();
    });
    
    it('preprocess returns false if node already has an operator', () => {
        const el = getTestElement('*for', 'item of items');
        const def = createNodeDef(el);

        const op = parser.get('generator', el);

        // Manually seed an operator to simulate "already processed"
        def.setGenerator(op, { type: 'for' });

        expect(op.preprocess(def, el)).toBe(false);
    });

    it('process does nothing when data is null', () => {
        const el = getTestElement('*for', 'item of items');
        const op = parser.get('generator', el);

        expect(() => {
            op.process(null, {}, el);
        }).not.toThrow();
    });

    it('process does nothing when data.type is not "for"', () => {
        const el = getTestElement('*for', 'item of items');
        const op = parser.get('generator', el);

        expect(() => {
            op.process({ type: 'not-for' }, {}, el);
        }).not.toThrow();
    });

});
