
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Enso, { 
    html, watches, getWatched, setWatched, lifecycle
} from "../../src/enso.js";

import { nextFrame, setup, clearDOM } from '../shared.js';


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


// State callbacks (watchers)
const scriptCallbacks = 'enso-script-callback-test';
const mocks = {
    message: vi.fn(),
    counter: vi.fn(),
    mount: vi.fn(),
    update: vi.fn(),
    unMount: vi.fn(),
};
Enso.component(scriptCallbacks, {
    watched: { message: 'hello', counter: 0 },
    template: html`<div #ref='div'>{{ watched:message }}</div>`,
    script: {
        onMessageChange: watches((prop, value) => {
            mocks.message(prop, value);
        }, ['message']),

        onCounterChange: watches((prop, value) => {
            mocks.counter(prop, value);
        }, ['counter'], true),

        mount: watches(() => {
            mocks.mount();
        }, [lifecycle.mount]),

        update: watches(() => {
            mocks.update();
        }, [lifecycle.update]),

        unmount: watches(() => {
            mocks.unMount();
        }, [lifecycle.unmount]),
    }
});

describe('Script state callbacks', () => {

    let el;
    beforeEach(() => {
        vi.clearAllMocks(); // reset mock call history
        [el] = setup(scriptCallbacks);
    });
    afterEach(() => clearDOM());

    it('calls watchers on watched property change', () => {
        // 1. Should trigger the "message" watcher only
        el.watched.message = 'World';
        expect(mocks.message).toHaveBeenCalledWith('message', 'World');
        expect(mocks.counter).not.toHaveBeenCalled();

        // 2. "keep" behavior
        expect(el.onMessageChange).toBeUndefined();
        expect(typeof el.onCounterChange).toBe('function');

        // 3. Changing counter should trigger its watcher
        el.watched.counter++;
        expect(mocks.counter).toHaveBeenCalledWith('counter', 1);

        // 4. Manually calling the kept watcher should also invoke it
        el.onCounterChange('counter', el.watched.counter);
        expect(mocks.counter).toHaveBeenCalledTimes(2);
    });

    it('calls watchers on lifecycle changes', () => {
        expect(mocks.mount).toHaveBeenCalled();
        expect(mocks.unMount).not.toHaveBeenCalled();
        vi.clearAllMocks();
    });
});

// Watched property accessing
const scriptAccess = 'enso-script-access-test';
const mockFn = vi.fn();
Enso.component(scriptAccess, {
    watched: { message: 'Hello', counter: 0 },
    template: html`
        <div #ref="div">
            {{ this.greet( watched:message ) }}
        </div>`,

    script: {
        onChange: watches((prop, value) => {
            mockFn(prop, value);
        }, [ 'message', 'counter' ]),

        greet(msg) {
            return `This is the message ${msg}`;
        },

        updateValues() {
            let { message, counter } = getWatched(this);

            message = 'updated';
            counter++;

            setWatched(this, { message, counter });
        },

        getValues() {
            return [
                this.watched.message, 
                this.watched.counter
            ];
        }
    }
});

describe('Script custom methods access', () => {
   
    let el;
    beforeEach(() => {
        vi.clearAllMocks(); // reset mock call history
        [el] = setup(scriptAccess);
    });

    it('can access and alter watched properties with helpers', () => {
        el.updateValues();
        expect(el.watched.counter).toBe(1);
        expect(mockFn).toBeCalledTimes(2);
    });

    it('can access watched properties directly', () => {
        const [message, counter] = el.getValues();
        expect(message).toBe('Hello');
        expect(counter).toBe(0);
    });

    it('can interact with templates', async () => {
        el.watched.message = 'World';
        expect(mockFn).toHaveBeenCalledWith('message', 'World');
        await nextFrame();
        expect(el.refs.div.textContent.trim()).toBe('This is the message World');
    });
});
