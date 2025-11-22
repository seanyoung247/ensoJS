
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { html } from "../../src/enso.js";
import { nextFrame } from '../shared.js';
import EnsoComponent from '../../src/component.js';


Enso.component( "enso-attr-test", {

    watched: {
        show: true,
        value: { value: 0, attribute: { type: Number, force: true } },
        str: { value: 'test', attribute: { type: String } }
    },

    template: html`
        <button #ref="incBtn" @click="()=>watched:value++">Inc</button>
        <span 
            #ref="display" 
            enso-attr:style="color:{{ (watched:value > 5) ? 'red' : 'green' }};"
            :data-value="{{ watched:value }}"
            :data-show="{{ watched:show }}"
        >
            {{ watched:value }}
        </span>
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

        expect(el.watched.value).toBe(0);
        expect(el.hasAttribute('value')).toBe(true);
        expect(el.getAttribute('value')).toBe('0');
        expect(display.getAttribute('data-value')).toBe('0');
        expect(display.getAttribute('style')).toContain('green');

        el.watched.value = 5;
        await nextFrame();
        expect(el.watched.value).toBe(5);
        expect(el.getAttribute('value')).toBe('5');
        expect(display.getAttribute('data-value')).toBe('5');
        expect(display.getAttribute('style')).toContain('green');
        
        incBtn.click();
        await nextFrame();
        expect(el.watched.value).toBe(6);
        expect(el.getAttribute('value')).toBe('6');
        expect(display.getAttribute('data-value')).toBe('6');
        expect(display.getAttribute('style')).toContain('red');

        el.setAttribute('value', '10');
        el.setAttribute('value', '10'); // Cheating a bit for full coverage
        await nextFrame();
        expect(el.watched.value).toBe(10);
        expect(el.getAttribute('value')).toBe('10');
        expect(display.getAttribute('data-value')).toBe('10');
        expect(display.getAttribute('style')).toContain('red');

        el.setAttribute('str', 'show');
        expect(el.hasAttribute('str')).toBe(true);
        el.watched.str = null;
        expect(el.hasAttribute('str')).toBe(false);

        el.watched.show = false;
        await nextFrame();
        expect(el.hasAttribute('data-show')).toBe(false);
    });

});