
/**
 * @module helpers - Defines helper functions for use in html templates
 */
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

// Converts camelCase names to dash-case
const camelToDash = str => (
    str.replace(/(?:\B)[A-Z]/g, match => `-${match}`)
        .toLowerCase()
);

/**
 * Generates a class list string for use in the DOM class attribute from 
 * the passed arguments.
 * @param  { ...any } classes - Arguments that can resolve to css class names
 * @returns { String } class list
 */
export const classList = (...classes) => (
    classes.filter(v => v).join(' ')
);

/**
 * Generates a css string from a style object
 * @param { Object } css - Style object
 * @returns { String } string of css rulesets
 */
export const cssObj = css => (
    Object.entries(css).map(([key, value])=> {

        key = camelToDash(key);

        if (value) {
            return (typeof value === 'object') ?
                `${key} {${cssObj(value)}}\n` :     // Nested object -> selector
                `${key}:${value};`;                 // Property : value
        }
        return null; // If value is falsy

    }).join('')
);
