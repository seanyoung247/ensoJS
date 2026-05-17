
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Enso, { html } from "../../src/enso.js";

import { ATTACH_TEMPLATE } from '../../src/core/symbols.js';


Enso.component( "enso-basic-test", {
    template: html`
        <style>
            div > span {
                color: red;
            }
        </style>
        <div #ref="root">
            Hello <span>World!</span>
        </div>
    `
});


describe('Basic Enso Component', () => {
    
    beforeEach(() => {
        document.body.innerHTML = 
            /*html*/`<enso-basic-test id="test-component"></enso-basic-test>`;
    });

    let el, root, span, styleEl;
    beforeEach(() => {
        el = document.getElementById("test-component");

        root = el.shadowRoot;
        span = root.querySelector("span");
        styleEl = root.querySelector("style");
    });

    it('parses the template and initialises component correctly', () => {
        expect(el).toBeInstanceOf(HTMLElement);
        expect(el.refs).toBeDefined();
        expect(el.refs.root).toBeInstanceOf(HTMLDivElement);
    });

    it('renders static content correctly', () => {
        expect(styleEl).toBeTruthy();
        expect(styleEl.textContent).toContain("color: red");

        expect(span).toBeTruthy();
        expect(span.textContent).toBe("World!");
        expect(el.refs.root.textContent.trim()).toBe("Hello World!");

    });

    it("doesn't allow multiple connection", () => {
        const attachSpy = vi.spyOn(el, ATTACH_TEMPLATE);
        el.connectedCallback();
        expect(attachSpy).not.toHaveBeenCalled();
    });

});

/* Basic Ignore Test */
Enso.component( "enso-ignore-test", {
    template: html`
        <div>
            <script>const x="{{ This should not be parsed }}";</script>
            <p class="ignored" enso:ignore>
                {{ "This should not be parsed" }}
            </p>
            <p class="ignored children" 
                :data-enso-test="{{ true ? 'This should be parsed' : 'Not this' }}" 
                enso:ignore-children>
                {{ "This should not be parsed" }}
            </p>
            <p class="not-ignored">
                {{ "This should be parsed" }}
            </p>
        </div>
    `
});

describe('Basic Enso ignores', () => {
    
    beforeEach(() => {
        document.body.innerHTML = 
            /*html*/`<enso-ignore-test id="test-component"></enso-ignore-test>`;
    });

    let el, root;
    beforeEach(() => {
        el = document.getElementById("test-component");
        root = el.shadowRoot;
    });

    describe('enso:ignore', () => {
        it('removes script tags from templates', () => {
            const script = root.querySelector("script");
            expect(script).toBeNull();
        });

        it('ignores parsing of elements with enso:ignore attribute', () => {
            const p = root.querySelector("p.ignored");
            expect(p.textContent).toContain("{{ \"This should not be parsed\" }}");
        });

        it('parses elements with enso:ignore-children attribute, but ignores children', () => {
            const p = root.querySelector("p.ignored.children");
            expect(p.textContent).toContain("{{ \"This should not be parsed\" }}");
            expect(p.getAttribute("data-enso-test")).toBe("This should be parsed");
        });

        it('parses normal elements as expected', () => {
            const p = root.querySelector("p.not-ignored");
            expect(p.textContent).not.toContain("{{ \"This should be parsed\" }}");
        });
    });
});