
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { html } from "../../src/enso.js";
import { nextFrame } from '../shared.js';
import EnsoComponent from '../../src/component.js';


Enso.component( "enso-attr-test", {

    watched: {
        value: { value: 0, attribute: { type: Number, force: true } }
    },

    template: html`
        <button #ref="incBtn" @click="()=>this.value++">Inc</button>
        <span #ref="display" :data-value="{{ this.value }}">{{ this.count }}</span>
    `

});


beforeEach(() => {
    document.body.innerHTML = 
        /*html*/`<enso-attr-test id="test-component"></enso-attr-test>`;

});

describe('Enso Attributes', () => {

    let el, incBtn, display;
    beforeEach(() => {
        el = document.getElementById("test-component");
        incBtn = el.refs.incBtn;
        display = el.refs.display;
    });

    it('parses the template and sets default values', () => {
        expect(el).toBeInstanceOf(EnsoComponent);
        expect(el).toBeInstanceOf(HTMLElement);
        expect(incBtn).toBeDefined();
        expect(incBtn).toBeInstanceOf(HTMLButtonElement);
        expect(display).toBeDefined();
        expect(display).toBeInstanceOf(HTMLSpanElement);
    });

    it('reflects attribute and property changes', async () => {
        expect(el.value).toBe(0);
        expect(el.getAttribute('value')).toBe('0');
        expect(display.getAttribute('data-value')).toBe('0');

        el.value = 5;
        await nextFrame();
        expect(el.value).toBe(5);
        expect(el.getAttribute('value')).toBe('5');
        expect(display.getAttribute('data-value')).toBe('5');
        
        incBtn.click();
        await nextFrame();
        expect(el.value).toBe(6);
        expect(el.getAttribute('value')).toBe('6');
        expect(display.getAttribute('data-value')).toBe('6');

        el.setAttribute('value', '10');
        el.attributeChangedCallback('value', 6, '10'); // JSDOM doesn't call this properly
        await nextFrame();
        expect(el.value).toBe(10);
        expect(el.getAttribute('value')).toBe('10');
        expect(display.getAttribute('data-value')).toBe('10');
    });

});