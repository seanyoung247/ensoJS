
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
    it('returns early if root is not Document or ShadowRoot', () => {
        const fakeRenderRoot = {
            getRootNode() {
                return {}; // not Document, not ShadowRoot
            }
        };

        const sheet = new CSSStyleSheet();
        const spy = vi.spyOn(document, 'adoptedStyleSheets', 'set');

        attachStyleSheets(fakeRenderRoot, [sheet]);

        expect(spy).not.toHaveBeenCalled();
    });

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

    it('attaches stylesheets not already adopted', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(':host { display: block; }');

        attachStyleSheets(host, [sheet]);

        expect(document.adoptedStyleSheets).toContain(sheet);
    });

    it('does not duplicate an already adopted stylesheet', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);

        const sheet = new CSSStyleSheet();

        attachStyleSheets(host, [sheet]);
        attachStyleSheets(host, [sheet]);

        expect(
            document.adoptedStyleSheets.filter(s => s === sheet)
        ).toHaveLength(1);
    });

    it('does not duplicate stylesheets within the supplied array', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);

        const sheet = new CSSStyleSheet();

        attachStyleSheets(host, [sheet, sheet]);

        expect(
            document.adoptedStyleSheets.filter(s => s === sheet)
        ).toHaveLength(1);
    });
});