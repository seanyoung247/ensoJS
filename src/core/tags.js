
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import EnsoTemplate from "../templates/template.js";
import { createStyleSheet } from "../utils/css.js";


const combine = (strings, ...values) => (
    strings.reduce((a,c,i) => a + c + (values[i] || ''), '')
);

/**
 * Parses a template string and returns an Enso stylesheet
 * @returns {CSSStyleSheet}
 */
export const css = (strings, ...values) => (
    createStyleSheet(combine(strings, ...values))
);
    
/**
 * Parses a template string and returns an Enso HTML template
 * @returns {EnsoTemplate}
 */
export const html = (strings, ...values) => (
    new EnsoTemplate(combine(strings, ...values))
);
