
// import EnsoStylesheet from "../templates/stylesheets.js";
import EnsoTemplate from "../templates/templates.js";
import { createStyleSheet } from "./css.js";

// Is valid string value?
const isValid = v => !(v === true || v === false || v === null || v === undefined);

const combine = (strings, ...values) => (
    strings.reduce((a,c,i) => a + c + (values[i] || ''), '')
);

/**
 * Parses a string template and values for use in component reactive fields
 * @returns {String|Boolean} - parsed string or true
 */
export const parse = (strings, ...values) => {
    let isBool = false;
    const str = strings.reduce((a,c,i) => {
        const value = values[i];
        if (value === true) isBool = true;
        return a + c + (isValid(value) ? value : '');
    }, '');
    return (isBool && !str) ? true : str;
};

/**
 * Parses a template string and returns an Enso stylesheet
 * @returns {CSSStyleSheet}
 */
export const css = (strings, ...values) =>
    createStyleSheet(combine(strings, ...values));
    // new EnsoStylesheet(combine(strings, ...values));

/**
 * Parses a template string and returns an Enso HTML template
 * @returns {EnsoTemplate}
 */
export const html = (strings, ...values) => 
    new EnsoTemplate(combine(strings, ...values));