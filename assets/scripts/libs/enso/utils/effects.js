
import { parse } from "./tags.js";


// export const createStringTemplate = (value) => (
//     `parse\`${value
//         .replaceAll('{{', '${')
//         .replaceAll('}}', '}')
//         .trim()}\``
// );

const getCode = (value) => (
    `parse\`${value
        .replaceAll('{{', '${')
        .replaceAll('}}', '}')
        .trim()}\``
);

export const createStringTemplate = (value) => {
    const code = getCode(value);
    return `with (environment) {return (() => {"use strict"; return ${code}}).call(this)}`;
};

export const createFunction = (() => {
    const cache = {};

    return (...args) => {
        const key = args.join('&');
        // return cache[key] ?? (cache[key] = new Function('parse', ...args));
        return cache[key] ?? (cache[key] = new Function('environment', ...args));
    };
})();

export const runEffect = (fn, context, ...args) => {
    const environment = { parse };
    if (fn) fn.call(context, environment, ...args);
};
