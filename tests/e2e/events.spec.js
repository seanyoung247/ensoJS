
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { html } from "../../src/enso.js";
import { nextFrame } from '../shared.js';
import EnsoComponent from '../../src/component.js';


Enso.component( "enso-events-test", {

    watched: {
        flag: false
    },

    template: html`
        <div #ref="root">
            <div id="bound">{{ @:flag.toString() }}</div>
            <button @click="()=>watched:flag = !watched:flag">Test Me!</button>
            {{/*empty effect*/}}
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
        expect(el).toBeInstanceOf(EnsoComponent);
        expect(el).toBeInstanceOf(HTMLElement);
        expect(el.refs).toBeDefined();
        expect(el.refs.root).toBeInstanceOf(HTMLDivElement);

        expect(bound.textContent.trim()).toBe('false');
        expect(button.hasAttribute('@click')).toBe(false);
    });

    it('reacts to events and property changes', async () => {
        button.click();
        await nextFrame();
        expect(bound.textContent.trim()).toBe('true');
    });

});