
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { prop, attr, html } from "../../src/enso.js";
import { nextFrame, setup } from '../shared.js';
import { isReactive } from '../../src/core/watcher.js';

const watchedTest = "enso-basic-watched-test";
Enso.component( watchedTest, {
    watched: {
        // Shorthand for primitive values
        show: true,
        // Shorthand attribute
        name: attr('Test'),
        // Partial
        num: attr(null, Number),
        // Full definition
        count: attr(0, Number),
    },
    template: html`
        <div id="watched-test"> 
            <p id="show-para">show = {{ @:show.toString() }}</p>
            <p id="name-para">name = {{ @:name }}</p>
            <p id="count-para">count = {{ watched:count }}</p>
        </div>
    `,
});

describe('Basic watched properties', () => {

    let el, root;
    beforeEach(async () => {
        [el, root] = setup(watchedTest);
        await nextFrame();
    });

    it("sets up watched properties", () => {
        // Property is created with correct values and settings
        expect(el.watched.show).toBeDefined();
        expect(el.watched.show).toBe(true);
        expect(el.watched.name).toBeDefined();
        expect(el.watched.name).toBe('Test');
        expect(el.watched.num).toBeDefined();
        expect(el.watched.num).toBeNull();
        expect(el.watched.count).toBeDefined();
        expect(el.watched.count).toBe(0);
        // Ensure not wrapped by a proxy
        expect(isReactive(el.watched.show)).toBe(false);
        expect(isReactive(el.watched.name)).toBe(false);
        expect(isReactive(el.watched.num)).toBe(false);
        expect(isReactive(el.watched.count)).toBe(false);
        // Attributes are created correctly
        expect(el.hasAttribute('show')).toBe(false);
        expect(el.hasAttribute('name')).toBe(true);
        expect(el.hasAttribute('num')).toBe(false);
        expect(el.hasAttribute('count')).toBe(true);
        // Correct values are inserted into DOM
        const showEl = root.querySelector('#show-para');
        const nameEl = root.querySelector('#name-para');
        const countEl = root.querySelector('#count-para');
        expect(showEl.textContent).toBe('show = true');
        expect(nameEl.textContent).toBe('name = Test');
        expect(countEl.textContent).toBe('count = 0');
    });

    // Reactivity
    it("reacts to changes", async () => {
        el.watched.show = false;
        expect(el.watched.show).toBe(false);
        el.watched.name = null;
        expect(el.watched.name).toBeNull();
        expect(el.hasAttribute('name')).toBe(false);
        el.setAttribute('count', 5);
        expect(el.watched.count).toBe(5);
        el.watched.num = 10;
        el.watched.num = null;

        await nextFrame();

        const showEl = root.querySelector('#show-para');
        const nameEl = root.querySelector('#name-para');
        const countEl = root.querySelector('#count-para');
        expect(showEl.textContent).toBe('show = false');
        expect(nameEl.textContent).toBe('name = ');
        expect(countEl.textContent).toBe('count = 5');
    });
});


// Objects/Arrays + Deep reactivity
const complexWatched = "enso-complex-watched-test";
Enso.component(complexWatched, {
    watched: {
        show: attr(true),
        list: prop([1,2,3], true),
        objList: prop([
            { name: "John Smith", age: 25 },
            { name: "Anne Lake", age: 32 },
            { name: "Mary Sue", age: 19 }
        ]),
        options: prop({
            showNames: true,
            nested: {
                bool: true,
                deep: { 
                    num: 5,
                    str: 'test' 
                },
            }
        }, true)
    },
    template: html`
        <div id="options">
            <button id="names-btn"
                @click="()=>@:options.showNames = !@:options.showNames"
            >
                {{ @:options.showNames ? 'Hide' : 'Show' }} Names
            </button>
            <ul id="optList">
                <li>
                    <button id="opt-btn" 
                        @click="()=>@:options.nested.bool = !@:options.nested.bool"
                    >
                        {{ @:options.nested.bool ? 'Hide' : 'Show' }} Options
                    </button>
                </li>
                <li *if="{{ @:options.nested.bool }}" class="option">
                    Number = {{ @:options.nested.deep.num }}
                </li>
                <li *if="{{ @:options.nested.bool }}" class="option">
                    String = {{ @:options.nested.deep.str }}
                </li>
            </ul>
        </div>
        <div id="list" data-length="{{ @:list.length }}">List length = {{ @:list.length }}</div>
        <ul id="names" *if="{{ @:options.showNames }}">
            <li *for="{name, age} of @:objList">
                <p>Name: {{ name }}</p>
                <p>Age: {{ age }}</p>
            </li>
        </ul>
    `
});

describe('Complex watched properties', () => {

    let el, root;
    beforeEach(async () => {
        [el, root] = setup(complexWatched);
        await nextFrame();
    });

    it('sets up watched properties', async () => {
        // Property is created with correct values and settings
        expect(el.watched.show).toBe(true);
        expect(el.watched.list).toEqual([1,2,3]);
        expect(el.watched.objList).toEqual([
            { name: "John Smith", age: 25 },
            { name: "Anne Lake", age: 32 },
            { name: "Mary Sue", age: 19 }
        ]);
        expect(el.watched.options).toEqual({
            showNames: true,
            nested: {
                bool: true,
                deep: { 
                    num: 5,
                    str: 'test' 
                },
            }
        });
        // Only deep reactive properties should be proxied
        expect(isReactive(el.watched.show)).toBe(false);
        expect(isReactive(el.watched.list)).toBe(true);
        expect(isReactive(el.watched.objList)).toBe(false);
        expect(isReactive(el.watched.options)).toBe(true);
        // Attributes are setup
        expect(el.hasAttribute('show')).toBe(true);
        // Correct values in DOM
        await nextFrame();
        const optList = root.querySelectorAll('#optList > li');
        const names = root.querySelectorAll('#names > li');
        expect(optList.length).toBe(el.watched.list.length);
        expect(names.length).toBe(el.watched.objList.length);
        expect(names[1].children[0].textContent).toBe("Name: Anne Lake");
    });

    // Reactivity
    it("reacts to changes", async () => {
        expect(el.hasAttribute('show')).toBe(true);
        el.watched.show = false;
        expect(el.hasAttribute('show')).toBe(false);
        el.setAttribute('show', true);
        expect(el.hasAttribute('show'));
        expect(el.watched.show).toBe(true);
        // Deep reactive properties should react to changes
        el.watched.list.push( 4, 5 );
        el.watched.options.nested.deep.num = 10;

        await nextFrame();

        const list = root.querySelector('#list');
        // expect(list.dataset.length).toBe('5');
        expect(list.textContent).toBe('List length = 5');
    });
});
