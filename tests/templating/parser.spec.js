
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from '../../src/templates/parser.js';
import { NodeDef, NodeDefMap} from '../../src/templates/nodedef.js';
import { ENSO_NODE, ENSO_ROOT } from '../../src/core/symbols.js';
import '../../src/templates/parsers/parsers.js';

describe('Template Parser', () => {
    let div;
    beforeEach(() => {
        div = document.createElement('div');
    });

    it('rejects nodes without template directives', () => {
        expect(parser.preprocess(new NodeDef('test', div, null), div)).toBe(false);
        expect(div.hasAttribute('enso-node')).toBe(false);
    });

    it('can register and retrieve node parsers', () => {
        const testParser = {
            type: 'test',
            match(node) { return node.tagName === 'TEST'; },
            preprocess() { return true; },
            process() { return true; }
        };
        parser.registerNode(testParser);

        const testNode = document.createElement('test');
        expect(parser.getNodeParser(testNode)).toBe(testParser);
        expect(parser.getNodeParser(div)).toBe(null);
    });

    it('can register and retrieve attribute parsers', () => {
        const testAttrParser = {
            type: 'testAttr',
            match(node, attr) { return attr.name === 'test-attr'; },
            preprocess() { return true; },
            process() { return true; }
        };
        parser.registerAttr(testAttrParser);
        div.setAttribute('test-attr', 'value');

        const attr = div.getAttributeNode('test-attr');
        expect(parser.getAttrParser(div, attr)).toBe(testAttrParser);
        expect(parser.getAttrParser(div, document.createAttribute('other-attr'))).toBe(null);
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
        div.setAttribute(ENSO_ROOT, '');
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
});

describe('Reference Parser', () => {
    let div, ref, map;
    beforeEach(() => {
        div = document.createElement('div');
        div.innerHTML = '<div #ref="myRef"></div>';
        ref = div.firstChild;

        map = new NodeDefMap();
    });
    
    it('parses ref tags correctly', () => {
        const def = new NodeDef('test', ref, map);
        // Preprocess should extract the ref, remove the template attribute 
        // and attach the parser and watched tag
        expect(parser.preprocess(def, ref)).toBe(true);
        expect(def.ref).toBe('myRef');
        expect(ref.hasAttribute(ENSO_NODE)).toBe(true);

        // Process should attach the ref to the parent component
        const parent = { component: { refs: {} } };
        parser.process(def, parent, ref);
        expect(parent.component.refs.myRef).toBe(ref);
        expect(ref.hasAttribute(ENSO_NODE)).toBe(false);
    });
});
