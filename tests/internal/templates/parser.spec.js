
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from '../../../src/templates/parser.js';
import { NodeDef } from '../../../src/templates/nodedef.js';
import { Enso } from '../../../src/enso.js';

import { ENSO_NODE, ENSO_PARSED, ENSO_ROOT } from '../../../src/core/symbols.js';
import { parseSource, getName } from '../../../src/templates/parsers/utils.js';
import { compileValue } from '../../../src/core/effects.js';


describe('Template Parser', () => {
    let div;
    beforeEach(() => {
        div = document.createElement('div');
    });

    it('rejects nodes without template directives', () => {
        expect(parser.preprocess(new NodeDef('test', div, null), div)).toBe(false);
        expect(div.hasAttribute('enso-node')).toBe(false);
    });

    it('can register and retrieve generator parsers', () => {
        const testParser = {
            type: 'test',
            match(node) { return node.tagName === 'TEST'; },
            preprocess() { return true; },
            process() { return true; }
        };
        parser.register(testParser, 'generator');

        const testNode = document.createElement('test');
        expect(parser.get('generator', testNode)).toBe(testParser);
        expect(parser.get('generator', div)).toBe(null);
    });

    it('can register and retrieve mutator parsers', () => {
        const testAttrParser = {
            type: 'testAttr',
            match(node, attr) { return attr.name === 'test-attr'; },
            preprocess() { return true; },
            process() { return true; }
        };
        parser.register(testAttrParser);
        div.setAttribute('test-attr', 'value');

        const attr = div.getAttributeNode('test-attr');
        expect(parser.get('attribute', div, attr)).toBe(testAttrParser);
        expect(parser.get('attribute', div, document.createAttribute('other-attr'))).toBe(null);
    });

    it('marks root elements correctly', () => {
        parser.markRoot(div);
        expect(div.hasAttribute(ENSO_ROOT)).toBe(true);
    });

    it('gets root elements correctly', () => {
        div.innerHTML = `
            <div ${ENSO_ROOT}></div>
            <div></div>
            <div ${ENSO_ROOT}></div>
        `;
        const root = parser.getRoot(div);
        expect(root).toBe(div.children[0]);
        expect(parser.getRoot(div.children[1])).toBe(null);
    });

    it('detects parsed elements correctly', () => {
        expect(parser.isParsed(div)).toBe(false);
        div.setAttribute(ENSO_PARSED, '');
        expect(parser.isParsed(div)).toBe(true);
    });

    it('gets watched elements correctly', () => {
        div.innerHTML = `
            <div ${ENSO_NODE}></div>
            <div></div>
            <div ${ENSO_NODE}></div>
        `;
        const watched = parser.getWatched(div);
        expect(watched).toBe(div.children[0]);
        expect(parser.getWatched(div.children[1])).toBe(null);
    });

    it('preprocessor deals with parser failure', () => {
        parser.register({
            type: 'failAttr',
            match() { return true; },
            preprocess() { return false; },
        });

        div.setAttribute('fail-attr', 'value');
        const def = new NodeDef('test', div, null);
        expect(parser.preprocess(def, div)).toBe(false);
    });

    it('throws with bad input', () => {
        expect(()=>parser.register(null, 'badType')).toThrow();
        expect(()=>parser.get('badType', null, null)).toThrow();
    });

    it('can add custom parsers', () => {
        Enso.use(function(register, ctx) {
            register.attribute({
                type: 'test:parser',
                match(node, attribute) {
                    return (
                        node.nodeType === Node.ELEMENT_NODE &&
                        isAttr(attribute, '^', 'test')
                    );
                },
                preprocess(def, node, attribute) {
                    const name = getName(attribute);
                    const binds = new Set();
                    const source = compileValue(
                        parseSource(attribute.value, binds)
                    );
                    def.addMutator(this, {
                        name, binds
                    });
                    node.removeAttribute(attribute.name);
                    return true;
                },
                process(data, _, element) {
                    for (const attr of data) {
                        for (const bind of attr.binds) {
                            element.setAttribute('data-test', 'true');
                        }
                    }
                }
            });
        });

        div.setAttribute('enso-test', '');
    });

    expect(()=>parser.get('attribute', div, div.attributes[0])).toBeDefined();
});

