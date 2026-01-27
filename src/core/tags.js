
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import EnsoTemplate from "../templates/template.js";
import { createStyleSheet } from "../utils/css.js";


const combine = (strings, ...values) => {
    // Used as a parser function
    if (typeof strings === "string") return strings;
    // Used as a template tag
    return strings.reduce((a,c,i) => a + c + (values[i] || ''), '');
};

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

/**
 * Internal: Create a callable component tag wrapper.
 *
 * Supports:
 *   ${Comp}                    → <tag></tag>
 *   ${Comp(attrs)}             → <tag attr="..."></tag>
 *   ${Comp(null, children)}    → <tag>children</tag>
 *   ${Comp(attrs, 'children')} → <tag attr="...">children</tag>
 * 
 * @param {string} tag - custom element name
 * @param {class} ComponentClass - the actual component constructor
 * @param {object|null} attrs - optional attributes to include
 * @returns {function} - callable template tag function + metadata
 */
export function createComponentTag(tag, ComponentClass) {
    function Comp(attrs, children) {
        const attrStr = attrs
            ? Object.entries(attrs).reduce((s, [k, v]) => {
                if (v === true) return `${s} ${k}`;
                if (v != null && v !== false) return `${s} ${k}="${v}"`;
                return s;
            }, "")
            : "";

        return children != null
            ? `<${tag}${attrStr}>${children}</${tag}>`
            : `<${tag}${attrStr}></${tag}>`;
    }

    Comp.toString = () => `<${tag}></${tag}>`;
    Comp.tag = tag;
    Comp.Class = ComponentClass;

    return Comp;
}
