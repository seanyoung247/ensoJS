
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { html } from "../../src/enso.js";
import { ROOT } from '../../src/core/symbols.js';
import { nextFrame } from '../shared.js';


const setup = (component) => {
    document.body.innerHTML = 
        `<${component} id="test-component"></${component}>`;

    const el = document.getElementById('test-component');
    const root = el[ROOT];
    return [ el, root ];
};


const basicIF = 'enso-if-basic-test';
Enso.component(basicIF, {
  properties: { show: { value: true } },
  template: html`
    <div>
      <div id="if-test" *if="{{ this.show }}">Visible</div>
    </div>
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
        el.show = false;
        await nextFrame();
        expect(root.querySelector('#if-test')).toBeNull();
    });

});


const multiIF = 'enso-if-multi-test';
Enso.component(multiIF, {
    properties: { show: { value: true } },
    template: html`
        <div id="if-test1" *if="{{ this.show }}">Content</div>
        <div id="if-test2" *if="{{ this.show === false }}">No Content</div>
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
        el.show = false;
        await nextFrame();
        expect(root.querySelector('#if-test1')).toBeNull();
        expect(root.querySelector('#if-test2')).toBeTruthy();
    });

});


const nestedIF = 'enso-if-nested-test';
Enso.component(nestedIF, {
    properties: { 
        show: { value: true },
        showChild: { value: false },
    },
    template: html`
        <div id="if-test-parent" *if="{{ this.show }}">
            Parent Div
            <div id="never-shown" *if="{{ !this.show }}">Never Shown</div>
            <div id="if-test-child" *if="{{ this.showChild }}">Child Content</div>
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
        el.showChild = true;
        await nextFrame();
        expect(root.querySelector('#if-test-child')).toBeTruthy();
    });

    it('removes content when condition is false', async () => {
        el.show = false;
        await nextFrame();
        expect(root.querySelector('#if-test-parent')).toBeNull();
        expect(root.querySelector('#if-test-child')).toBeNull();
        expect(root.querySelector('#never-shown')).toBeNull();
    });

});
