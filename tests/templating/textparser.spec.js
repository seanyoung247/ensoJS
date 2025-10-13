
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from '../../src/templates/parser.js';
import { NodeDef, NodeDefMap } from '../../src/templates/nodedef.js';
import { ENSO_NODE, GET_BINDING } from '../../src/core/symbols.js';
import '../../src/templates/parsers/textParser.js';

describe('Text Parser', () => {
    let div, textNode, parentNode, def, parent;
    beforeEach(() => {
        div = document.createElement('div');
        div.innerHTML = '<div>Hello {{ this.name }}!</div>';
        parentNode = div.firstChild;
        textNode = parentNode.firstChild;
        def = new NodeDef('test', textNode, new NodeDefMap());
        parent = {
            [GET_BINDING]() { return null; },
            name: 'World',
        };
    });

    it('parses text bindings correctly', () => {
        // Preprocess should extract the bindings, remove the template attributes 
        // and attach the parser and watched tags to the parent node
        expect(parser.preprocess(def, textNode)).toBe(true);
        expect(def.content[0].binds.has('name')).toBe(true);
        expect(parentNode.hasAttribute(ENSO_NODE)).toBe(true);

        // Process should attach the effects to the parent component
        parser.process(def, parent, parentNode);
        expect(parentNode.hasAttribute(ENSO_NODE)).toBe(false);
    });
});