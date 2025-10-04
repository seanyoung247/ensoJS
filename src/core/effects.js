
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { parse } from "./tags.js";
import { ENV } from "./symbols.js";

const objectMasks = Object.freeze({
    Window: {}, Document: {}, eval: null, Function: null, setTimeout:null
});
const rootEnv = Object.freeze({parse, ...objectMasks});

/**
 * 
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
export const createStringTemplate = value => (
    `parse\`${value
        .replaceAll('{{', '${')
        .replaceAll('}}', '}')
        .trim()}\``
);

// Encapsulates effect body code in wrapper code
const createFunctionBody = code => (
    `with (env) {
        return (() => {
            "use strict";
            return ${code};
        })();
    }`
);

/**
 * Creates a new effect function
 * @param {...any} - List of string parameter names and string function code body
 * @returns {Function} - Compiled function
 */
export const createEffect = (() => {
    const cache = {};

    return (...args) => {
        const key = args.join('&');
        const body = createFunctionBody(args.pop());
        return cache[key] ?? (cache[key] = new Function('env', ...args, body));
    };
})();

/**
 * Runs an effect created with createEffect
 * @param {typeof Enso} parent  - Effect parent 
 * @param {Object} effect       - Effect definition object
 */
export const runEffect = (parent, effect) => {
    const context = parent.component;
    const scope = parent[ENV];
    effect?.action?.call(context, scope, effect)
}
