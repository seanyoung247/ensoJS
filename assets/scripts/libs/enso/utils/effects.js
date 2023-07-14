
import { parse } from "./tags.js";

export const createStringTemplate = (value) => (
    `parse\`${value
        .replaceAll('{{', '${')
        .replaceAll('}}', '}')
        .trim()}\``
);

export const createFunction = (() => {
    const cache = {};

    return (...args) => {
        const key = args.join('&');
        return cache[key] ?? (cache[key] = new Function('parse', ...args));
    };
})();

export const runEffect = (fn, context, ...args) => {
    if (fn) fn.call(context, parse, ...args);
};

parse`${ this.count }`;