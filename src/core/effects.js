
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { ensoError, ensoReport } from "./errors.js";
import { ENV } from "./symbols.js";

const isValid = v => !(v === true || v === false || v === null || v === undefined);
const parse = (strings, ...values) => {
    let isBool = false;
    const str = strings.reduce((a,c,i) => {
        const value = values[i];
        if (value === true) isBool = true;
        return a + c + (isValid(value) ? value : '');
    }, '');
    return (isBool && !str) ? true : str;
};


const objectMasks = Object.freeze({
    Window: {}, Document: {}, eval: null, Function: null, setTimeout: null
});
const rootEnv = Object.freeze({parse, ...objectMasks});

/**
 * Constructs an environment ENV object
 * @param {Object} args     - (Optional) Object containing environment 
 * @param {Object} baseEnv  - (Optional) Base environment to extend
 * @returns {Object} - New effect environment
 */
export const createEffectEnv = (args = {}, baseEnv = rootEnv) => (
    Object.freeze(
        Object.assign(
            Object.create(baseEnv), args
        )
    )
);

/**
 * Formats expression code as a string litteral
 * @param {String} value - Text and JS expressions in handlebars format
 * @returns {String} - Formatted expression
 */
export const compileValue = value => (
    /*js*/
    `(()=>parse\`${value
        .replaceAll('{{', '${')
        .replaceAll('}}', '}')
        .trim()}\`)`
);

// Encapsulates effect body code in wrapper code
const createFunctionBody = code => (
    /*js*/
    `with (env) {
        return (() => {
            "use strict";
            try { return ${code}; } catch(e) {
                this._report('error', 'E_EFFECT_RUNTIME', e);
                return undefined;
            }
        })();
    }`
);

const createAction = code => {
    const body = createFunctionBody(code);
    try {
        return new Function('env', body);
    } catch(e) {
        ensoReport('error', "E_EFFECT_COMPILE", `\n${e}\n${body}`);
        return () => () => {/* no-op on error */};
    }
};

export class Effect {
    #element;
    #action;
    constructor(parent, element, action) {
        this.#element = element;
        try {
            this.#action = action.createFunc(parent);
        } catch (e) {
            ensoReport('error', "E_EFFECT_CREATE", `\n${e}\n${action}`);
            this.#action = () => {};
        }
    }

    get element() { return this.#element; }
    get action() { return this.#action; }

    run() {
        try {
            return this.#action?.();
        } catch (e) {
            ensoReport('error', "E_EFFECT_RUNNING", `\n${e}\n${this.#action.toString()}`);
            return undefined;
        }
    }
}

export class Action {
    #Effect; #code; #data; #func;

    constructor(code, data = {}, effect = Effect) {
        this.#code = code;
        this.#Effect = effect;
        this.#data = data;
        this.#func = createAction(code);
    }

    get data() { return this.#data; }
    get code() { return this.#code; }

    createEffect(parent, element) {
        return ( new this.#Effect(
            parent, element, this
        ));
    }
    
    createFunc(parent) {
        const { component, [ENV]: env } = parent;
        const fn = this.#func.call(component, env);
        const cType = typeof fn;
        if (cType !== 'function') {
            ensoError('E_EFFECT_FUNC', cType)
        }
        return fn;
    }
}
