
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from '../../src/templates/parser.js';
import { NodeDef, NodeDefMap } from '../../src/templates/nodedef.js';
import { ENSO_NODE, GET_BINDING } from '../../src/core/symbols.js';
import '../../src/templates/parsers/attrParser.js';

describe('Attribute Parser', () => {
    let div, attr, def, parent;
    beforeEach(() => {
        div = document.createElement('div');
        div.innerHTML = '<div :class="this.class" :data-active="this.isActive"></div>';
        attr = div.firstChild;

        def = new NodeDef('test', attr, new NodeDefMap());

        parent = { 
            [GET_BINDING]() { return null; } 
        };
    });

    it('parses attribute bindings correctly', () => {
        // Preprocess should extract the bindings, remove the template attributes 
        // and attach the parser and watched tags
        expect(parser.preprocess(def, attr)).toBe(true);
        expect(def.attributes.length).toBe(2);
        expect(def.attributes[0].name).toBe('class');
        expect(def.attributes[0].binds.has('class')).toBe(true);
        expect(def.attributes[1].name).toBe('data-active');
        expect(def.attributes[1].binds.has('isActive')).toBe(true);
        expect(attr.hasAttribute(ENSO_NODE)).toBe(true);
        expect(attr.hasAttribute(':title')).toBe(false);
        expect(attr.hasAttribute(':data-active')).toBe(false);

        // Process should attach the effects to the parent component
        parser.process(def, parent, attr);
        expect(attr.hasAttribute(ENSO_NODE)).toBe(false);
    });
});