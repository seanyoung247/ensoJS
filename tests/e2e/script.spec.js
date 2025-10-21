
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import Enso, { html, watches } from "../../src/enso.js";
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
// const scriptHooks = 'enso-script-hooks-test';
// describe('Script lifecycle hooks', () => {

//     let el;
//     const script = {
//         onStart: vi.fn(),
//         onPropertyChange: vi.fn(),
//         preUpdate: vi.fn(),
//         postUpdate: vi.fn(),
//         onRemoved: vi.fn(),
//     };
//     beforeAll(() => {
//         Enso.component(scriptHooks, {
//             watched: { message: 'hello!' },
//             template: html`<div #ref="div">{{ watched:message }}</div>`,
//             script,
//         });
//     });
//     beforeEach(() => { vi.clearAllMocks(); });

//     it('calls onStart after mount', async () => {
//         expect(script.onStart).not.toHaveBeenCalled();
//         [el] = setup(scriptHooks);
//         await nextFrame();
//         expect(script.onStart).toHaveBeenCalled();
//     });

//     it('calls onPropertyChange when a property changes', () => {
//         el.watched.message = 'world';
//         expect(script.onPropertyChange).toHaveBeenCalledWith('message', 'world');
//     });

//     it('calls pre and post update hooks', async () => {
//         el.watched.message = 'Updated!';
//         await nextFrame();
//         expect(script.preUpdate).toHaveBeenCalled();
//         expect(script.postUpdate).toHaveBeenCalled();
//         expect(el.refs.div.textContent.trim()).toBe('Updated!');
//     });

//     it('calls onRemoved when component is unmounted', () => {
//         el.remove();
//         expect(script.onRemoved).toHaveBeenCalled();
//     });
// });


// Watched property callbacks
const scriptCallbacks = 'enso-script-callback-test';
const mockMessage = vi.fn();
const mockCounter = vi.fn();
Enso.component(scriptCallbacks, {
    watched: { message: 'hello', counter: 0 },
    template: html`<div #ref='div'>{{ watched:message }}</div>`,
    script: {
        onMessageChange: watches((prop, value) => {
            mockMessage(prop, value);
        }, ['message']),
        onCounterChange: watches((prop, value) => {
            mockCounter(prop, value);
        }, ['counter'], true),
    }
});

describe('Script property changed callbacks', () => {

    let el;
    beforeEach(() => {
        vi.clearAllMocks(); // reset mock call history
        [el] = setup(scriptCallbacks);
    });

    it('calls watchers on watched property change', () => {
        // 1. Should trigger the "message" watcher only
        el.watched.message = 'World';
        expect(mockMessage).toHaveBeenCalledWith('message', 'World');
        expect(mockCounter).not.toHaveBeenCalled();

        // 2. "keep" behavior
        expect(el.onMessageChange).toBeUndefined();
        expect(typeof el.onCounterChange).toBe('function');

        // 3. Changing counter should trigger its watcher
        el.watched.counter++;
        expect(mockCounter).toHaveBeenCalledWith('counter', 1);

        // 4. Manually calling the kept watcher should also invoke it
        el.onCounterChange('counter', el.watched.counter);
        expect(mockCounter).toHaveBeenCalledTimes(2);
    });
});

// Watched property accessing
const scriptAccess = 'enso-script-access-test';
const mockFn = vi.fn();
Enso.component(scriptAccess, {
    watched: { message: 'hello', counter: 0 },
    template: html`
        <div #ref="div">
            {{ this.greet(watched:message) }} = {{ watched:counter }}
        </div>`,

    script: {
        onChange: watches((prop, value) => {
            mockFn(prop, value);
        }, [ 'message', 'counter' ]),

        greet(msg) {
            return `This is the message ${msg}`;
        },

        values() {

        }
    }
});
