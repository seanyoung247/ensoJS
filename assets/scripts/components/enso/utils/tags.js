import EnsoStylesheet from "../templates/stylesheets.js";
import EnsoTemplate from "../templates/templates.js";

const isValid = v => !(v === false || v === null || v === undefined);

const combine = values => {
    return (a,c,i) => {
        const value = values[i];
        return a += c + (isValid(value) ? value : '');
    };
};

export const parse = (strings, ...values) => 
    strings.reduce(combine(values), '');

/**
 * Parses a template string and returns an Enso stylesheet
 * @returns {EnsoStylesheet}
 */
export const css = (strings, ...values) => 
    new EnsoStylesheet(parse(strings, ...values));

/**
 * Parses a template string and returns an Enso HTML template
 * @returns {EnsoTemplate}
 */
export const html = (strings, ...values) => 
    new EnsoTemplate(parse(strings, ...values));