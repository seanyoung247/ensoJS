
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { html, attr, prop, lifecycle, watches } from "../../src/enso.js";
import { nextFrame, setup } from '../shared.js';


const basicIF = 'enso-if-basic-test';
Enso.component(basicIF, {
  watched: { show: true },
  template: html`
    <div id="if-test" *if="watched:show">Visible</div>
    {{ @:show.toString() }}
  `
});


describe('Basic IF directive', () => {

    let el, root;
    beforeEach(() => {
        [el, root] = setup(basicIF);
    });

    it('renders content when condition is true', () => {
        expect(root.querySelector('#if-test')).toBeTruthy();
    });

    it('removes content when condition is false', async () => {
        el.watched.show = false;
        await nextFrame();
        expect(root.querySelector('#if-test')).toBeNull();
    });

});


const multiIF = 'enso-if-multi-test';
Enso.component(multiIF, {
    watched: { show: true },
    template: html`
        <div id="if-test1" *if="watched:show">Content</div>
        <div id="if-test2" enso-if="watched:show === false">No Content</div>
    `
});


describe('Multiple IF directives', () => {

    let el, root;
    beforeEach(() => {
        [el, root] = setup(multiIF);
    });

    it('renders content when condition is true', () => {
        expect(root.querySelector('#if-test1')).toBeTruthy();
        expect(root.querySelector('#if-test2')).toBeNull();
    });

    it('removes content when condition is false', async () => {
        el.watched.show = false;
        await nextFrame();
        expect(root.querySelector('#if-test1')).toBeNull();
        expect(root.querySelector('#if-test2')).toBeTruthy();
    });

});


const nestedIF = 'enso-if-nested-test';
Enso.component(nestedIF, {
    watched: { 
        show: true,
        showChild: false,
    },
    template: html`
        <div id="if-test-parent" *if="watched:show">
            Parent Div
            <div id="never-shown" *if="!watched:show">Never Shown</div>
            <div id="if-test-child" *if="watched:showChild">Child Content</div>
        </div>
    `
});

describe('Nested IF directives', () => {

    let el, root;
    beforeEach(() => {
        [el, root] = setup(nestedIF);
    });

    it('renders content when condition is true', async () => {
        expect(root.querySelector('#if-test-parent')).toBeTruthy();
        expect(root.querySelector('#if-test-child')).toBeNull();
        expect(root.querySelector('#never-shown')).toBeNull();
        el.watched.showChild = true;
        await nextFrame();
        expect(root.querySelector('#if-test-child')).toBeTruthy();
    });

    it('removes content when condition is false', async () => {
        el.watched.show = false;
        await nextFrame();
        expect(root.querySelector('#if-test-parent')).toBeNull();
        expect(root.querySelector('#if-test-child')).toBeNull();
        expect(root.querySelector('#never-shown')).toBeNull();
    });

});

describe("If element creation", () => {

    it('does not instantiate an initially false branch', async () => {
        let instances = 0;

        const childTag = 'enso-if-lazy-child-test';

        Enso.component(childTag, {
            watched: {},
            template: html`<span>Child</span>`,
            script: {
                onInit: watches(
                    ()=>instances++,
                    [lifecycle.mount]
                )
            }
        });

        const parentTag = 'enso-if-lazy-parent-test';

        Enso.component(parentTag, {
            watched: {
                show: false
            },
            template: html`
                <${childTag} *if="@:show"></${childTag}>
            `
        });

        const [el, root] = setup(parentTag);

        await nextFrame();

        expect(instances).toBe(0);
        expect(root.querySelector(childTag)).toBeNull();

        el.watched.show = true;

        await nextFrame();

        expect(instances).toBe(1);
        expect(root.querySelector(childTag)).not.toBeNull();
    });

    it('terminates recursive components when an IF condition becomes false', async () => {
        const tag = 'enso-recursive-if-test';

        let mounts = 0;

        Enso.component(tag, {
            watched: {
                count: attr(0)
            },

            template: html`
                <enso-recursive-if-test
                    *if="@:count > 0"
                    :count="{{ @:count - 1 }}">
                </enso-recursive-if-test>
            `,

            script: {
                mounted: watches(function () {
                    mounts++;
                }, [lifecycle.mount]),
            }
        });

        const [el] = setup(tag, { count: 3 });

        await nextFrame();

        expect(mounts).toBe(4);
    });
    
});

// Mixed IF/FOR nesting

const forInsideIf = 'enso-for-inside-if-test';

Enso.component(forInsideIf, {
    watched: {
        show: false,
        items: prop(['a', 'b'], true)
    },
    template: html`
        <ul *if="@:show">
            <li class="nested-item" *for="item of @:items">
                {{ item }}
            </li>
        </ul>
    `
});

describe('FOR inside IF', () => {
    let el, root;

    beforeEach(() => {
        [el, root] = setup(forInsideIf);
    });

    it('uses the latest items when a lazy IF first mounts', async () => {
        expect(root.querySelector('ul')).toBeNull();

        el.watched.items = ['c', 'd', 'e'];
        await nextFrame();

        expect(root.querySelectorAll('.nested-item')).toHaveLength(0);

        el.watched.show = true;
        await nextFrame();

        const items = root.querySelectorAll('.nested-item');

        expect(items).toHaveLength(3);
        expect(Array.from(items, item => item.textContent.trim()))
            .toEqual(['c', 'd', 'e']);
    });

    it('uses updated items after unmounting and remounting', async () => {
        el.watched.show = true;
        await nextFrame();

        expect(root.querySelectorAll('.nested-item')).toHaveLength(2);

        el.watched.show = false;
        await nextFrame();

        expect(root.querySelector('ul')).toBeNull();

        el.watched.items = ['x', 'y', 'z'];
        await nextFrame();

        el.watched.show = true;
        await nextFrame();

        const items = root.querySelectorAll('.nested-item');

        expect(Array.from(items, item => item.textContent.trim()))
            .toEqual(['x', 'y', 'z']);
    });
});


const ifInsideFor = 'enso-if-inside-for-test';

Enso.component(ifInsideFor, {
    watched: {
        items: prop([
            { name: 'Alice', visible: true },
            { name: 'Bob', visible: false },
            { name: 'Charlie', visible: true }
        ], true)
    },
    template: html`
        <div class="outer-item" *for="item of @:items">
            <span class="visible-item" *if="item.visible">
                {{ item.name }}
            </span>
        </div>
    `
});

describe('IF inside FOR', () => {
    let el, root;

    beforeEach(() => {
        [el, root] = setup(ifInsideFor);
    });

    it('evaluates each iteration independently', () => {
        const outer = root.querySelectorAll('.outer-item');

        expect(outer).toHaveLength(3);
        expect(outer[0].querySelector('.visible-item').textContent)
            .toContain('Alice');
        expect(outer[1].querySelector('.visible-item')).toBeNull();
        expect(outer[2].querySelector('.visible-item').textContent)
            .toContain('Charlie');
    });

    it('updates nested conditions when the array changes', async () => {
        el.watched.items = [
            { name: 'Alice', visible: false },
            { name: 'Bob', visible: true },
            { name: 'Diana', visible: true }
        ];

        await nextFrame();

        const outer = root.querySelectorAll('.outer-item');

        expect(outer).toHaveLength(3);
        expect(outer[0].querySelector('.visible-item')).toBeNull();
        expect(outer[1].querySelector('.visible-item').textContent)
            .toContain('Bob');
        expect(outer[2].querySelector('.visible-item').textContent)
            .toContain('Diana');
    });
});