
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeAll } from 'vitest';
import Enso, { html } from "../../src/enso.js";
import { nextFrame, setup } from '../shared.js';

const basicFor = 'enso-for-basic-test';
Enso.component(basicFor, {
    watched: { items: { value:[1,2,3], deep: true } },
    template: html`
        <div id="for-root">
            <div class="for-test" *for="item of @:items">
                Item: {{ item }}
            </div>
        </div>
    `
});

describe('Basic FOR directive', () => {

    let el, root;
    beforeAll(() => {
        [el, root] = setup(basicFor);
    });

    it('renders correct number of items', () => {
        const items = root.querySelectorAll('.for-test');
        expect(items.length).toBe(3);
    });

    it('updates when items change', async () => {
        el.watched.items.push(4, 5);

        await nextFrame();
        const items = root.querySelectorAll('.for-test');
        expect(items.length).toBe(5);

        el.watched.items.splice(1, 2); // Remove 2 items
        await nextFrame();
        const updatedItems = root.querySelectorAll('.for-test');
        expect(updatedItems.length).toBe(3);
        // Ensure correct items remain
        expect(updatedItems[0].textContent).toContain('1');
        expect(updatedItems[1].textContent).toContain('4');
        expect(updatedItems[2].textContent).toContain('5');
    });

    it ('handles empty list', async () => {
        el.watched.items = [];
        await nextFrame();
        const items = root.querySelectorAll('.for-test');
        expect(items.length).toBe(0);

        el.watched.items = [10, 20];
        await nextFrame();
        const newItems = root.querySelectorAll('.for-test');
        expect(newItems.length).toBe(2);
        expect(newItems[0].textContent).toContain('10');
        expect(newItems[1].textContent).toContain('20');

        el.watched.items = [];
        await nextFrame();
        expect(root.querySelectorAll('.for-test').length).toBe(0);
    });

});


const nonDeepFor = 'enso-for-non-deep-test';
Enso.component(nonDeepFor, {
    watched: { items: { value:[ 'x', 'y', 'z' ], deep: false } },
    template: html`
        <div id="for-non-deep-root">
            <div class="for-non-deep-test" *for="item of @:items">
                Item: {{ item }}
            </div>
        </div>
    `
});

describe('FOR directive with non-deep watched property', () => {

    let el, root;
    beforeAll(() => {
        [el, root] = setup(nonDeepFor);
    });

    it('renders correct number of items', () => {
        const items = root.querySelectorAll('.for-non-deep-test');
        expect(items.length).toBe(3);
    });

    it('updates when items replaced', async () => {
        el.watched.items = ['a', 'b'];
        await nextFrame();
        const items = root.querySelectorAll('.for-non-deep-test');
        expect(items.length).toBe(2);
        expect(items[0].textContent).toContain('a');
        expect(items[1].textContent).toContain('b');
    });

    it('does not update on internal mutations', async () => {
        el.watched.items.push('c');
        await nextFrame();
        const items = root.querySelectorAll('.for-non-deep-test');
        expect(items.length).toBe(2); // Should remain 2
    });

});


const indexFor = 'enso-for-index-test';
Enso.component(indexFor, {
    watched: { items: { value:['a','b','c'], deep: true } },
    template: html`
        <div id="for-index-root">
            <div class="for-index-test" *for="[index, item] of @:items.entries()">
                Index: {{ index }}, Item: {{ item }}
            </div>
        </div>
    `
});

describe('FOR directive with index', () => {

    let el, root;
    beforeAll(() => {
        [el, root] = setup(indexFor);
    });

    it('renders correct indices and items', () => {
        const items = root.querySelectorAll('.for-index-test');
        expect(items.length).toBe(3);
        expect(items[0].textContent).toContain('Index: 0, Item: a');
        expect(items[1].textContent).toContain('Index: 1, Item: b');
        expect(items[2].textContent).toContain('Index: 2, Item: c');
    });
    
    it('updates indices when items change', async () => {
        el.watched.items.unshift('z'); // Add at start
        await nextFrame();
        const items = root.querySelectorAll('.for-index-test');
        expect(items.length).toBe(4);
        expect(items[0].textContent).toContain('Index: 0, Item: z');
        expect(items[1].textContent).toContain('Index: 1, Item: a');
        expect(items[2].textContent).toContain('Index: 2, Item: b');
        expect(items[3].textContent).toContain('Index: 3, Item: c');
        
        el.watched.items.splice(1, 2); // Remove 2 items
        await nextFrame();
        const updatedItems = root.querySelectorAll('.for-index-test');
        expect(updatedItems.length).toBe(2);
        expect(updatedItems[0].textContent).toContain('Index: 0, Item: z');
        expect(updatedItems[1].textContent).toContain('Index: 1, Item: c');
    });

});


const destructureFor = 'enso-for-destructure-test';
Enso.component(destructureFor, {
    watched: { 
        items: { 
            value:[ 
                { name:'Alice', age: 20, address: { city: 'Wonderland' } }, 
                { name:'Bob', age: 31, address: { city: 'Builderland' } }, 
                { name:'Charlie', age: 25, address: { city: 'Chocolate Factory' } },
                { name:'Diana', age: 28, }
            ],
            deep: true 
        } 
    },
    template: html`
        <div id="for-destructure-root">
            <div class="for-destructure-test" *for="{name, age, address} of @:items">
                Name: {{ name }}<br/>
                Age: {{ age }}
                City: {{ address?.city || 'N/A' }}
            </div>
        </div>
    `
});

describe('FOR directive with destructuring', () => {

    let el, root;
    beforeAll(() => {
        [el, root] = setup(destructureFor);
    });

    it('renders correct names', () => {
        const items = root.querySelectorAll('.for-destructure-test');
        expect(items.length).toBe(el.watched.items.length);
        expect(items[0].textContent).toContain('Name: Alice');
        expect(items[1].textContent).toContain('Name: Bob');
        expect(items[1].textContent).toContain('Age: 31');
        expect(items[2].textContent).toContain('Name: Charlie');
        expect(items[2].textContent).toContain('City: Chocolate Factory');
    });

    it('updates when items change', async () => {
        el.watched.items.push({name:'Edna'});
        await nextFrame();
        const items = root.querySelectorAll('.for-destructure-test');
        expect(items.length).toBe(el.watched.items.length);
        expect(items[3].textContent).toContain('Name: Diana');

        el.watched.items.splice(0, 2); // Remove first two
        await nextFrame();
        const updatedItems = root.querySelectorAll('.for-destructure-test');
        expect(updatedItems.length).toBe(el.watched.items.length);
        expect(updatedItems[0].textContent).toContain('Name: Charlie');
        expect(updatedItems[1].textContent).toContain('Name: Diana');
    });

});


