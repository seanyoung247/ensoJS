
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from '../../src/templates/parser.js';
import { NodeDef, NodeDefMap } from '../../src/templates/nodedef.js';
import { ENV, ENSO_NODE } from "../../src/core/symbols.js";

import '../../src/templates/parsers/eventParser.js';


describe('Event Parser', () => {
    let div, button, def, component;
    beforeEach(() => {
        div = document.createElement('div');
        div.innerHTML = 
            `<button
                @click="this.doSomething" 
                @keydown="(e) => { this.keydown = true; this.event = e; }">
            </button>`;
        button = div.firstChild;

        def = new NodeDef('test', button, new NodeDefMap());

        component = new class {
            [ENV] = {};
            doSomething() { this.clicked = true; }
            clicked = false;
            keydown = false;
            event = null;
        };
    });
    
    it('parses event tags correctly', () => {
        // Preprocess should extract the events, remove the template attributes 
        // and attach the parser and watched tag
        expect(parser.preprocess(def, button)).toBe(true);
        expect(def.events.length).toBe(2);
        expect(def.events[0].name).toBe('click');
        expect(def.events[1].name).toBe('keydown');

        expect(button.hasAttribute(ENSO_NODE)).toBe(true);

        // Process should attach the event listeners to the element
        parser.process(def, { component }, button);
        expect(button.hasAttribute(ENSO_NODE)).toBe(false);

        // Simulate events to test handlers
        button.click();
        expect(component.clicked).toBe(true);

        const keydownevent = new Event('keydown');
        button.dispatchEvent(keydownevent);
        expect(component.keydown).toBe(true);
        expect(component.event).toBe(keydownevent);
    });
});