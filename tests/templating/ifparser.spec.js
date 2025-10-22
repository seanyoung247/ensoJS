
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from '../../src/templates/parser.js';
import { NodeDef, NodeDefMap } from '../../src/templates/nodedef.js';
import { ENSO_NODE, ENSO_ROOT, GET_BINDING } from '../../src/core/symbols.js';
import '../../src/templates/parsers/ifParser.js';

describe('If Parser', () => {
    let div, ifNode, parentNode, def, parent;
    beforeEach(() => {
        div = document.createElement('div');
        div.innerHTML = '<div *if="{{ this.watched.show }} *if="{{ this.watched.show }}" ">Visible Content</div>';
        parentNode = div.firstChild;
        ifNode = parentNode;
        def = new NodeDef('test', ifNode, new NodeDefMap());
        parent = {
            [GET_BINDING]() { return null; },
            watched: { show: true }
        };
    });

    it('parses if tags correctly', () => {
        // Preprocess should extract the bindings, remove the template attributes 
        // mark the node as a root point, and create a new NodeDef fragment root
        const test = parser.preprocess(def, ifNode);
        expect(test).toBe(true);
        expect(ifNode.hasAttribute(ENSO_ROOT)).toBe(true);
        expect(ifNode.getAttribute(ENSO_ROOT)).not.toBe(def.id);

        // Process should attach the effects to the parent component
        parser.process(def, parent, parentNode);
        expect(parentNode.hasAttribute(ENSO_NODE)).toBe(false);
    });
});
