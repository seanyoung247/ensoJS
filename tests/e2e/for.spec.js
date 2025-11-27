
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
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
    beforeEach(() => {
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

    it('updates correctly when array is reordered', async () => {
        el.watched.items = [3,1,2];
        await nextFrame();

        el.watched.items.sort();       // → [1,2,3]
        await nextFrame();

        const items = root.querySelectorAll('.for-test');
        expect(items[0].textContent).toContain('1');
        expect(items[1].textContent).toContain('2');
        expect(items[2].textContent).toContain('3');

        el.watched.items.reverse();    // → [3,2,1]
        await nextFrame();

        const reversed = root.querySelectorAll('.for-test');
        expect(reversed[0].textContent).toContain('3');
        expect(reversed[1].textContent).toContain('2');
        expect(reversed[2].textContent).toContain('1');
    });

    it('re-renders when replacing array with new instance', async () => {
        el.watched.items = [1,2,3];
        await nextFrame();

        // Replace with a new instance that contains the same values
        el.watched.items = [1,2,3];
        await nextFrame();

        const items = root.querySelectorAll('.for-test');
        expect(items.length).toBe(3);
        expect(items[0].textContent).toContain('1');
    });

    it('updates when iterator source changes', async () => {
        // Start with entries()
        el.watched.items = ['a', 'b', 'c'];
        await nextFrame();

        // Switch to keys()
        el.watched.items = Object.keys({x:1, y:2, z:3});
        await nextFrame();

        const items = root.querySelectorAll('.for-test');
        expect(items.length).toBe(3);
        // Should contain keys 'x', 'y', 'z'
        expect(items[0].textContent).toContain('x');
        expect(items[1].textContent).toContain('y');
        expect(items[2].textContent).toContain('z');

        // Switch to values()
        el.watched.items = Object.values({p:10, q:20});
        await nextFrame();

        const valueItems = root.querySelectorAll('.for-test');
        expect(valueItems.length).toBe(2);
        expect(valueItems[0].textContent).toContain('10');
        expect(valueItems[1].textContent).toContain('20');
        
        // Switch to a Set
        el.watched.items = new Set([100, 200, 300]);
        await nextFrame();

        const setItems = root.querySelectorAll('.for-test');
        expect(setItems.length).toBe(3);
        expect(setItems[0].textContent).toContain('100');
        expect(setItems[1].textContent).toContain('200');
        expect(setItems[2].textContent).toContain('300');
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
    beforeEach(() => {
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
        expect(items.length).toBe(3); // Should remain 3 [x,y,z]
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
    beforeEach(() => {
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


const objectFor = 'enso-for-object-test';
Enso.component(objectFor, {
    watched: { data: { value:{ a: 1, b: 2, c: 3 }, deep: true } },
    template: html`
        <div id="for-object-root">
            <div class="for-object-test" *for="[key, value] of Object.entries(@:data)">
                Key: {{ key }}, Value: {{ value }}
            </div>
        </div>
    `
});

describe('FOR directive with object entries', () => {

    let el, root;
    beforeEach(() => {
        [el, root] = setup(objectFor);
    });

    it('renders correct key-value pairs', () => {
        const items = root.querySelectorAll('.for-object-test');
        expect(items.length).toBe(3);
        expect(items[0].textContent).toContain('Key: a, Value: 1');
        expect(items[1].textContent).toContain('Key: b, Value: 2');
        expect(items[2].textContent).toContain('Key: c, Value: 3');
    });

    it('updates when object changes', async () => {
        el.watched.data.d = 4; // Add new key-value
        await nextFrame();
        const items = root.querySelectorAll('.for-object-test');
        expect(items.length).toBe(4);
        expect(items[3].textContent).toContain('Key: d, Value: 4');

        delete el.watched.data.b; // Remove a key
        await nextFrame();
        const updatedItems = root.querySelectorAll('.for-object-test');
        expect(updatedItems.length).toBe(3);
        expect(Array.from(updatedItems).some(
            item => item.textContent.includes('Key: b')
        )).toBe(false);
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
    beforeEach(() => {
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
        expect(items[4].textContent).toContain('Name: Edna');
        expect(items[4].textContent).toContain('City: N/A');

        el.watched.items.splice(0, 2); // Remove first two
        await nextFrame();
        const updatedItems = root.querySelectorAll('.for-destructure-test');
        expect(updatedItems.length).toBe(el.watched.items.length);
        expect(updatedItems[0].textContent).toContain('Name: Charlie');
        expect(updatedItems[1].textContent).toContain('Name: Diana');
    });

});


const nestedFor = 'enso-for-nested-test';
Enso.component(nestedFor, {
    watched: { 
        lists: { 
            value:[
                [1,2],
                [3,4,5],
                [6]
            ],
            deep: true 
        } 
    },
    template: html`
        <div id="for-nested-root">
            <div class="for-nested-outer" *for="innerList of @:lists">
                <div class="for-nested-inner" *for="item of innerList">
                    Item: {{ item }}
                </div>
            </div>
        </div>
    `
});

describe('Nested FOR directives', () => {

    let el, root;
    beforeEach(() => {
        [el, root] = setup(nestedFor);
    });

    it('renders correct number of nested items', () => {
        const outerLists = root.querySelectorAll('.for-nested-outer');
        expect(outerLists.length).toBe(3);

        const innerItems = root.querySelectorAll('.for-nested-inner');
        expect(innerItems.length).toBe(6); // 2 + 3 + 1 = 6
    });

    it('updates nested lists correctly', async () => {
        el.watched.lists[1].push(6); // Add to second inner list
        await nextFrame();
        let innerItems = root.querySelectorAll('.for-nested-inner');
        expect(innerItems.length).toBe(7);

        el.watched.lists.push([7,8]); // Add new inner list
        await nextFrame();
        const outerLists = root.querySelectorAll('.for-nested-outer');
        expect(outerLists.length).toBe(4);
        innerItems = root.querySelectorAll('.for-nested-inner');
        expect(innerItems.length).toBe(9); // 2 + 4 + 1 + 2 = 9

        el.watched.lists.splice(0,1); // Remove first inner list
        await nextFrame();
        const updatedOuterLists = root.querySelectorAll('.for-nested-outer');
        expect(updatedOuterLists.length).toBe(3);
        innerItems = root.querySelectorAll('.for-nested-inner');
        expect(innerItems.length).toBe(7); // 4 + 1 + 2 = 7
    });

});
