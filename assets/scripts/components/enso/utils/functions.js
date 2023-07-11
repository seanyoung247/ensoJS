
const isValid = v => !(v === false || v === null || v === undefined);

const parse = (strings, ...values) => {
    const str = strings.reduce((a,c,i) => {
        const value = values[i-1];
        return a += c + (isValid(value) ? value : '');
    });
    return str;
};

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

export const call = (fn, context, ...args) => {
    if (fn) fn.call(context, parse, ...args);
};
