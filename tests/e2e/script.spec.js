
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { html } from "../../src/enso.js";
import { setup } from '../shared.js';


const scriptBasic = 'enso-script-basic-test';
Enso.component(scriptBasic, {

    template: html`<div #ref="div">{{ this.greet() }}</div>`,

    script: {
        greet() { return 'Hello!'; },
        add(a, b) { return a + b; }
    }

});

describe('Basic custom code script', () => {

    let el, div;
    beforeEach(() => {
        [el] = setup(scriptBasic);
        div = el.refs.div;
    });

    it('should call script functions from templates', () => {
        expect(div.textContent.trim()).toBe("Hello!");
    });
});
