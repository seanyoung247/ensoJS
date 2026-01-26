
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
 *   ${Comp`children`}          → <tag>children</tag>
 *   ${Comp(attrs)}             → <tag attr="..."></tag>
 *   ${Comp(attrs)`children`}   → <tag attr="...">children</tag>
 * 
 * @param {string} tag - custom element name
 * @param {class} ComponentClass - the actual component constructor
 * @param {object|null} attrs - optional attributes to include
 * @returns {function} - callable template tag function + metadata
 */
export function createComponentTag(tag, ComponentClass, attrs=null) {

    // Helper: convert attrs object → HTML attribute string
    function attrStringFrom(attrs) {
        if (!attrs) return "";
        let out = "";
        for (const [key, value] of Object.entries(attrs)) {
            if (value === true) {
                out += ` ${key}`;               // boolean attribute
            } else if (value === false || value == null) {
                continue;                       // omit
            } else {
                out += ` ${key}="${String(value)}"`; // normal attribute
            }
        }
        return out;
    }

    function makeTagString(children = "") {
        const attrStr = attrStringFrom(attrs);
        return children
            ? `<${tag}${attrStr}>${children}</${tag}>`
            : `<${tag}${attrStr}></${tag}>`;
    }

    /**
     * Main wrapper function.
     *
     * If called as tagged template:
     *    Comp`children`
     *
     * If called as plain function:
     *    Comp({ attr: value })
     */
    function tagFn(strings, ...values) {
        // Case 1 — used as plain function to apply attributes
        if (!Array.isArray(strings) || !strings.raw) {
            const newAttrs = { ...(attrs || {}), ...strings };
            return createComponentTag(tag, ComponentClass, newAttrs);
        }

        // Case 2 — used as tagged template literal
        const children = String.raw(strings, ...values);
        return makeTagString(children);
    }

    Object.defineProperties(tagFn, {
        /** Empty usage: ${Comp} */
        toString: {
            value() { return makeTagString(); },
            enumerable: false
        },
        /** Ensure coercion always works */
        [Symbol.toPrimitive]: {
            value() { return makeTagString(); },
            enumerable: false
        },
        /** Expose original class for introspection */
        Class: {
            get() { return ComponentClass; },
            enumerable: false
        },
        /** Expose component tag name */
        tag: { value: tag, enumerable: true },
        /** Expose attributes object (mainly for debugging / inspection) */
        attrs: { value: attrs, enumerable: false }
    });

    return Object.freeze(tagFn);
};
