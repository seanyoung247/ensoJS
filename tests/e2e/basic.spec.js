
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
        <div #ref="test">
            Hello <span>World!</span>
        </div>
    `
});

beforeEach(() => {
    document.body.innerHTML = `<enso-basic-test id="test-component"></enso-basic-test>`;
});

describe('Basic Enso Componet', () => {

    it('Parses template and initialises component correctly', () => {
        const el = document.getElementById("test-component");
        expect(el).toBeInstanceOf(HTMLElement);
        expect(el.refs).toBeDefined();
        expect(el.refs.test).toBeInstanceOf(HTMLDivElement);
    });

    it('Renders static content correctly', () => {
        const el = document.getElementById("test-component");

        const root = el.shadowRoot;
        const span = root.querySelector("span");
        const styleEl = root.querySelector("style");

        expect(styleEl).toBeTruthy();
        expect(styleEl.textContent).toContain("color: red");

        expect(span).toBeTruthy();
        expect(span.textContent).toBe("World!");
        expect(el.refs.test.textContent.trim()).toBe("Hello World!");

    });

});
