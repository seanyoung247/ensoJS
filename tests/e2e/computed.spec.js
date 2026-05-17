
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { html, computed, prop } from "../../src/enso.js";
import { setup } from '../shared.js';


const computedTest = 'enso-computed-test';
Enso.component(computedTest, {
    watched: {
        num1: prop(0),
        num2: prop(0),
        sum: computed(function(){
            return this.num1 + this.num2;
        }, ['num1','num2'])
    },

    template: html`
        <span #ref="num1">{{ @:num1 }}</span>
        <span #ref="num2">{{ @:num2 }}</span>
        <span #ref="sum">{{ @:sum }}</span>
    `
});


describe("Computed Properties", () => {

    let el;
    beforeEach(() => {
        [el] = setup(computedTest);
    });

    it('recalculates value when dependencies change', () => {
        el.num1 = 1;
        expect(el.sum).toBe(1);
        el.num2 = 3;
        expect(el.sum).toBe(4);
    });

    it("doesn't allow property to be written too", () => {
        expect(() => {
            el.sum = 1
        }).toThrow();
        expect(() => {
            el.watched.sum = 1
        }).toThrow();
    });

});
