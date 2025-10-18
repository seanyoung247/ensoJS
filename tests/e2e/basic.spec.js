
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { html } from "../../src/enso.js";


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

beforeEach(() => {
    document.body.innerHTML = 
        /*html*/`<enso-basic-test id="test-component"></enso-basic-test>`;
});

describe('Basic Enso Component', () => {

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

});
