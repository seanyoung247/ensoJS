// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect } from 'vitest';

import EnsoTemplate from '../../../src/templates/template.js';
import { ENSO_NODE, ENSO_PARSED, ENSO_FRAGMENT } from '../../../src/core/symbols.js';

describe('EnsoTemplate', () => {

    it('creates a parsed HTMLTemplateElement', () => {
        const tpl = new EnsoTemplate(`<div>Hello</div>`);

        expect(tpl.template).toBeInstanceOf(HTMLTemplateElement);
        expect(tpl.template.hasAttribute(ENSO_PARSED)).toBe(true);
    });

    it('walks the DOM and parses text bindings', () => {
        const tpl = new EnsoTemplate(`<div>{{ value }}</div>`);
        const content = tpl.template.content;

        // Text binding should cause a watched node to exist
        const watched = content.querySelector(`[${ENSO_NODE}]`);
        expect(watched).not.toBeNull();
    });

    it('extracts fragment roots and replaces them with placeholders', () => {
        const tpl = new EnsoTemplate(`
            <div *if="{{ true }}">
                <span>Inner</span>
            </div>
        `);

        const content = tpl.template.content;

        // Ensure no remaining elements still have *if / enso-if
        const divs = [...content.querySelectorAll('div')];
        const hasIf = divs.some(el =>
            el.hasAttribute('*if') || el.hasAttribute('enso-if')
        );
        expect(hasIf).toBe(false);

        // Placeholder fragment should exist
        const fragment = content.querySelector('enso-fragment');
        expect(fragment).not.toBeNull();
        expect(fragment.childNodes.length).toBeGreaterThan(0);
    });

    it('process() returns a cloned DocumentFragment', () => {
        const tpl = new EnsoTemplate(`<div>Test</div>`);
        const parent = {};

        const dom = tpl.process(parent);

        expect(dom).toBeInstanceOf(DocumentFragment);
        expect(dom.querySelector('div')).not.toBeNull();
    });

    it('clone() creates a new EnsoTemplate sharing the watched map', () => {
        const tpl = new EnsoTemplate(`<div>{{ value }}</div>`);
        const clone = tpl.clone();

        expect(clone).toBeInstanceOf(EnsoTemplate);
        expect(clone).not.toBe(tpl);
        expect(clone.watchedNodes).toBe(tpl.watchedNodes);
    });

});
