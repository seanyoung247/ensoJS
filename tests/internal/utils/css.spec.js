
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect } from 'vitest';
import { createStyleSheet, attachStyleSheets } from '../../../src/utils/css.js';


describe('createStyleSheet', () => {
    it('creates a CSSStyleSheet from a CSS string', () => {
        const css = `
            body { background-color: blue; }
            .test { color: white; }
        `;
        const sheet = createStyleSheet(css);
        expect(sheet).toBeInstanceOf(CSSStyleSheet);
        expect(sheet.cssRules.length).toBe(2);
        expect(sheet.cssRules[0].cssText).toBe('body { background-color: blue; }');
        expect(sheet.cssRules[1].cssText).toBe('.test { color: white; }');
    });
});

describe('attachStyleSheets', () => {
    it('attaches stylesheets to document', () => {
        const css1 = 'body { margin: 0; }';
        const css2 = '.example { padding: 10px; }';
        const sheet1 = createStyleSheet(css1);
        const sheet2 = createStyleSheet(css2);

        // Clear any existing adoptedStyleSheets
        document.adoptedStyleSheets = [];    
        attachStyleSheets(document, [sheet1, sheet2]);
        expect(document.adoptedStyleSheets).toContain(sheet1);
        expect(document.adoptedStyleSheets).toContain(sheet2);
    });

    it('attaches stylesheets to ShadowRoot', () => {
        const css = 'p { font-size: 16px; }';
        const sheet = createStyleSheet(css);
        const host = document.createElement('div');
        const shadow = host.attachShadow({ mode: 'open' });

        // Clear any existing adoptedStyleSheets
        shadow.adoptedStyleSheets = [];
        attachStyleSheets(shadow, [sheet]);
        expect(shadow.adoptedStyleSheets).toContain(sheet);
    });
});