
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { prop, html } from "../../src/enso.js";
import { nextFrame, setup } from '../shared.js';


Enso.component( "enso-prop-write-test", {
    watched: {
        items: prop([], true)
    },
    template: html`
        <enso-prop-test #ref="test" .items="{{ @:items }}"></enso-prop-test>
    `,
    script: {
        getEl() {
            return this.refs.test;
        },
        getList() {
            return this.refs.test.refs.list;
        }
    }
});


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

    let wrapper, el, list;
    beforeEach(() => {
        [wrapper,] = setup("enso-prop-write-test");
        el = wrapper.getEl();
        list = wrapper.getList();
    });

    it('Parses the template and sets default values', () => {
        expect(list).toBeDefined();
        expect(list.children.length).toBe(0);
        expect(el.items).toBeDefined();
        expect(el.items.length).toBe(0);
    });

    it('Writes updated property to element', async () => {
        wrapper.items = [
            { name: 'one', value: 1 },
            { name: 'two', value: 2 },
            { name: 'three', value: 3 },
        ];
        await nextFrame();
        expect(el.items.length).toBe(3);
        expect(list.children.length).toBe(3);

        wrapper.items.push({ name: 'four', value: 4 });
        await nextFrame();
        expect(el.items.length).toBe(4);
        expect(list.children.length).toBe(4);
    });

    it('refuses undefined values', async () => {
        wrapper.items = [{ name: 'one', value: 1 }];
        await nextFrame();

        expect(el.items.length).toBe(1);
        expect(list.children.length).toBe(1);
        wrapper.items = undefined;
        await nextFrame();

        expect(el.items).toBeDefined();
        expect(el.items.length).toBe(1);
        expect(list.children.length).toBe(1);
    });

});