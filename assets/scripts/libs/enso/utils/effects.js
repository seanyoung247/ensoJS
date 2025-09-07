
import { parse } from "./tags.js";

const objectMasks = {
    Window: {}, Document: {}
}

/**
 * 
 * @param {Object} args - Object 
 * @returns 
 */
export const createEffectEnv = (args = {}) => Object.seal({
    parse, ...objectMasks, ...args
});

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
 * @param {Function} fn         - Effect function
 * @param {typeof Enso} context - Effect component
 * @param {...any} args         - Argument list
 */
export const runEffect = (fn, context, ...args) => {
    const env = context.env;
    if (fn) fn.call(context, env, ...args);
};
