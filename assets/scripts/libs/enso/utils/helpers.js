
/**
 * Generates a class list string for use in the DOM class attribute from 
 * the passed arguments.
 * @param  {...any} classes - Arguments that can resolve to css class names
 * @returns {String} class list
 */
export const classList = (...classes) => (
    classes.reduce((p, c) => p + (p && c ? ' ' : '') + (c || ''), '')
);