
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { prop, html } from "../../src/enso.js";
import { nextFrame, setup } from '../shared.js';
import EnsoComponent from '../../src/component.js';


Enso.component( "enso-prop-test", {

    watched: {
        items: prop([], true)
    },

    template: html`
        <ul #ref="list">
            <li *for="item of @:items">
                {{ item.name }} - {{ item.value }}
            </li>
        </ul>
    `
});


describe('Enso properties', () => {

    let el, root, list;
    beforeEach(() => {
        [el, root] = setup("enso-prop-test");
        list = el.refs.list;
    });

    it('Parses the template and sets default values', () => {
        expect(list).toBeDefined();
        expect(list.children.length).toBe(0);
        expect(el.items).toBeDefined();
        expect(el.items.length).toBe(0);
    });

});