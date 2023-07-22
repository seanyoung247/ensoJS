
// Converts camelCase names to dash-case
const camelToDash = str => str.replace(/(?:\B)[A-Z]/g, match => `-${match}`).toLowerCase();

/**
 * Generates a class list string for use in the DOM class attribute from 
 * the passed arguments.
 * @param  {...any} classes - Arguments that can resolve to css class names
 * @returns {String} class list
 */
export const classList = (...classes) => (
    classes.reduce((p, c) => p + (p && c ? ' ' : '') + (c || ''), '')
);

/**
 * Generates a css string from a style object
 * @param {Object} obj - Style object
 */
export const style = css => (
    Object.entries(css).map(([key, value])=> {
        key = camelToDash(key);
        if (typeof value === 'object') return `${key} {${style(value)}}\n`;
        else return `${key}:${value};`;
    }).join('')
);