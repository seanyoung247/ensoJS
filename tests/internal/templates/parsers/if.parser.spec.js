import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parser } from '../../../../src/templates/parser.js';
import { createNodeDef } from '../../../mockNodeDef.js';
import { getTestElement } from '../../../shared.js';

import '../../../../src/templates/parsers/ifParser.js';

// If you don’t already have this: small helper to make a dummy template
const createDummyTemplate = () => ({ __dummy: true });

describe('if operator parser', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('matches elements with *if shorthand', () => {
        const el = getTestElement('*if', '{{ watched:visible }}');
        const op = parser.getOperatorParser(el);

        expect(op).toBeDefined();
        expect(op.type).toBe('if');
    });

    it('matches elements with enso-if longhand', () => {
        const el = getTestElement('enso-if', '{{ watched:visible }}');
        const op = parser.getOperatorParser(el);

        expect(op).toBeDefined();
        expect(op.type).toBe('if');
    });

    it('preprocess creates a root NodeDef with an if operator and consumes the attribute', () => {
        const el = getTestElement('*if', '{{ watched:visible }}');

        // NOTE: createNodeDef should create def in a NodeDefMap so def.map exists.
        const def = createNodeDef(el);

        const op = parser.getOperatorParser(el);
        const parsed = op.preprocess(def, el);

        expect(parsed).toBe(true);

        // Attribute should be consumed
        expect(el.hasAttribute('*if')).toBe(false);
        expect(el.hasAttribute('enso-if')).toBe(false);

        // The node should have been marked as a root (createRoot called)
        // Your NodeDefMap uses ENSO_ROOT containing the NodeDef id
        expect(el.hasAttribute('data-enso-root')).toBe(true);

        // And there should now be a root NodeDef retrievable by root node
        const ifDef = def.map.getByRoot(el);
        expect(ifDef).not.toBeNull();

        const operator = ifDef.getOperator();
        expect(operator).toBeDefined();
        expect(operator.parser.type).toBe('if');

        expect(operator.data).toHaveProperty('type', 'if');
        expect(operator.data).toHaveProperty('action');
        expect(operator.data).toHaveProperty('binds');
        expect(operator.data).toHaveProperty('template', null);

        // binds should have something if watched:... was present
        expect(operator.data.binds.size).toBeGreaterThan(0);
    });

    it('preprocess returns false if an operator already exists on the node def', () => {
        const el = getTestElement('*if', '{{ watched:visible }}');
        const def = createNodeDef(el);

        const op = parser.getOperatorParser(el);

        // Simulate an existing operator
        def.setOperator(op, { type: 'dummy' });

        const parsed = op.preprocess(def, el);
        expect(parsed).toBe(false);
    });

    it('fragment hook assigns the fragment template to operator data', () => {
        const el = getTestElement('*if', '{{ watched:visible }}');
        const def = createNodeDef(el);

        const op = parser.getOperatorParser(el);
        op.preprocess(def, el);

        const ifDef = def.map.getByRoot(el);
        const dummyTemplate = createDummyTemplate();

        op.fragment(ifDef, dummyTemplate);

        expect(ifDef.getOperator().data.template).toBe(dummyTemplate);
    });

    it('process does nothing when data is null', () => {
        const el = getTestElement('*if', '');

        const op = parser.getOperatorParser(el);
        expect(op).toBeDefined();

        expect(() => {
            op.process(null, {}, el);
        }).not.toThrow();
    });

    it('process does nothing when data.type is not "if"', () => {
        const el = getTestElement('*if', '');

        const op = parser.getOperatorParser(el);
        expect(op).toBeDefined();

        expect(() => {
            op.process({ type: 'not-if' }, {}, el);
        }).not.toThrow();
    });

});
