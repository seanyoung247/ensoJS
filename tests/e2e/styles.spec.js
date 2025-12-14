
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { css, html } from "../../src/enso.js";
import { ROOT } from '../../src/core/symbols.js';

//// Simple stylesheets
Enso.component( 'enso-styles-test', {

    styles: css`
        .test {
            color: red;
        }
    `,

    template: html`<div class="test">Hello World</div>`,

});


describe('Enso Styles', () => {

    let el, root;
    beforeEach(async () => {
        document.body.innerHTML = 
            /*HTML*/`<enso-styles-test id="test-component"></enso-styles-test>`;

        el = document.getElementById("test-component");
        root = el[ROOT];
    });

    it('ataches adopted stylesheets to shadowRoot', () => {
        expect(root).toBeInstanceOf(ShadowRoot);
        expect(root.adoptedStyleSheets.length).toBe(1);
        expect(root.adoptedStyleSheets[0].cssRules[0].cssText).toContain('color: red');
    });
});

//// Multiple Stylesheets
Enso.component( 'enso-styles-merge-test', {

    styles: [css`
        .test {
            color: red;
        }
    `, css`
        .test2 {
            color: green;
        }
    `],

    template: html`<div class="test">Hello World</div>`,

});


describe('Enso Merge Styles', () => {

    let el, root;
    beforeEach(async () => {
        document.body.innerHTML = 
            /*HTML*/`<enso-styles-merge-test id="test-component"></enso-styles-merge-test>`;
        
        el = document.getElementById("test-component");
        root = el[ROOT];
    });

    it('attaches adopted stylesheets to shadowRoot', () => {
        expect(root).toBeInstanceOf(ShadowRoot);
        expect(root.adoptedStyleSheets.length).toBe(2);
        expect(root.adoptedStyleSheets[0].cssRules[0].cssText).toContain('color: red');
        expect(root.adoptedStyleSheets[1].cssRules[0].cssText).toContain('color: green');
    });
});


//// Stylesheets without shadowdom
Enso.component( 'enso-flat-styles-test', {
    settings: { useShadow: false },

    styles: css`
        .test {
            color: red;
        }
    `,

    template: html`<div class="test">Hello World</div>`

});



describe('Enso flat dom styling', () => {

    let el, root;
    beforeEach(async () => {
        document.body.innerHTML = 
            /*HTML*/`<enso-flat-styles-test id="test-component"></enso-flat-styles-test>`;
        
        el = document.getElementById("test-component");
        root = el[ROOT];
    });

    it('attaches adopted stylesheets to document', () => {
        expect(root).not.toBeInstanceOf(ShadowRoot);
        expect(document.adoptedStyleSheets.length).toBe(1);
        expect(document.adoptedStyleSheets[0].cssRules[0].cssText).toContain('color: red');
    });

});
