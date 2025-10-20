
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import Enso, { html } from "../../src/enso.js";
import { nextFrame, setup } from '../shared.js';


const scriptBasic = 'enso-script-basic-test';
Enso.component(scriptBasic, {

    template: html`<div enso-ref="div">{{ this.greet() }}</div>`,

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

    it('should append methods to element', () => {
        expect(el.add(2,6)).toBe(8);
    });

    it('should call script functions from templates', () => {
        expect(div.textContent.trim()).toBe("Hello!");
    });
});


// Lifecycle hooks
const scriptHooks = 'enso-script-hooks-test';
describe('Script lifecycle hooks', () => {

    let el;
    const script = {
        onStart: vi.fn(),
        onPropertyChange: vi.fn(),
        preUpdate: vi.fn(),
        postUpdate: vi.fn(),
        onRemoved: vi.fn(),
    };
    beforeAll(() => {
        Enso.component(scriptHooks, {
            watched: { message: 'hello!' },
            template: html`<div #ref="div">{{ watched:message }}</div>`,
            script,
        });
    });
    beforeEach(() => { vi.clearAllMocks(); });

    it('calls onStart after mount', async () => {
        expect(script.onStart).not.toHaveBeenCalled();
        [el] = setup(scriptHooks);
        await nextFrame();
        expect(script.onStart).toHaveBeenCalled();
    });

    it('calls onPropertyChange when a property changes', () => {
        el.watched.message = 'world';
        expect(script.onPropertyChange).toHaveBeenCalledWith('message', 'world');
    });

    it('calls pre and post update hooks', async () => {
        el.watched.message = 'Updated!';
        await nextFrame();
        expect(script.preUpdate).toHaveBeenCalled();
        expect(script.postUpdate).toHaveBeenCalled();
        expect(el.refs.div.textContent.trim()).toBe('Updated!');
    });

    it('calls onRemoved when component is unmounted', () => {
        el.remove();
        expect(script.onRemoved).toHaveBeenCalled();
    });
});


// Watched property callbacks
// Watched property accessing
// Watched property binding

