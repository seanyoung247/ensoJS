
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { html } from "../../src/enso.js";
import { setup } from '../shared.js';

const message = "Hello World";
const func = (str) => {
    return `str = ${str}`;
};

const exposeTest = 'enso-expose-test';
Enso.component( exposeTest, {
    expose: {
        message, func
    },
    template: html`
        <div #ref="msg">{{ message }}</div>
        <div #ref="func">{{ func("Function Test") }}</div>
    `
});


describe('Expose component field', () => {

    let el;
    beforeEach(() => {
        [el,] = setup(exposeTest);
    });
    
    it('exposes external values to template context', () => {
        const msg = el.refs.msg;
        const func = el.refs.func;
        expect(msg.textContent).toBe("Hello World");
        expect(func.textContent).toBe("str = Function Test");
    });
});
