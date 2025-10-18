
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { html } from "../../src/enso.js";
import { nextFrame } from '../shared.js';


Enso.component( "enso-events-test", {

    watched: {
        flag: { value: false }
    },

    template: html`
        <div #ref="root">
            <div id="bound">{{ this.flag ? 'True' : 'False' }}</div>
            <button @click="()=>this.flag = !this.flag">Test Me!</button>
        </div>
    `
});


beforeEach(() => {
    document.body.innerHTML = /*html*/`<enso-events-test id="test-component"></enso-events-test>`;
});

describe('Enso Events', () => {

    let el, button, bound;
    beforeEach(() => {
        el = document.getElementById("test-component");
        bound = el.refs.root.querySelector("#bound");
        button = el.refs.root.querySelector("button");
    });

    it('parses the template and sets default values', () => {
        expect(el).toBeInstanceOf(Enso);
        expect(el).toBeInstanceOf(HTMLElement);
        expect(el.refs).toBeDefined();
        expect(el.refs.root).toBeInstanceOf(HTMLDivElement);

        expect(bound.textContent.trim()).toBe('False');
        expect(button.hasAttribute('@click')).toBe(false);
    });

    it('reacts to events and property changes', async () => {
        button.click();
        await nextFrame();
        expect(bound.textContent.trim()).toBe('True');
    });

});