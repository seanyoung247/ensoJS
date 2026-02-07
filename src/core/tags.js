
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import EnsoTemplate from "../templates/template.js";
import { createStyleSheet } from "../utils/css.js";
import { createTemplate } from "../utils/dom.js";


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
 * Internal: Creates a callable component tag wrapper.
 *
 * The returned function serves two roles:
 *  - As a function, it creates a live element instance via the template pipeline.
 *  - Via `.tag`, it produces a string representation suitable for templates.
 *
 * Children are treated as **string-only** at this level and are inserted as
 * raw inner HTML. Non-string children are intentionally not handled here.
 *
 * @example
 *   Comp()                         // → <tag></tag> (Element)
 *   Comp({ disabled: true })       // → <tag disabled></tag>
 *   Comp(null, '<span>Hi</span>')  // → <tag><span>Hi</span></tag>
 *
 *   `${Comp.tag}`                  // "<tag></tag>"
 *   `${Comp.tag({ id: 'x' })}`     // "<tag id="x"></tag>"
 *   `${Comp.tag(null, 'text')}`    // "<tag>text</tag>"
 *
 * @param {string} tag
 *   Custom element tag name.
 *
 * @param {Function} ComponentClass
 *   Component constructor associated with this tag.
 *
 * @returns {Function & {
 *   tag: (attrs?: Object|null, children?: string|null) => string,
 *   Class: Function
 * }}
 *   Callable component factory with string tag helper.
 */
export function createComponentTag(tag, ComponentClass) {
    function Tag(attrs, children) {
        const attrStr = attrs
            ? Object.entries(attrs).reduce((s, [k, v]) => {
                if (v === true) return `${s} ${k}`;
                if (v != null && v !== false) return `${s} ${k}="${v}"`;
                return s;
            }, "")
            : "";

        return `<${tag}${attrStr}>${children ?? ''}</${tag}>`
    }
    Tag.toString = () => `<${tag}></${tag}>`;
    
    function Comp(attrs, children) {
        const tmpl = createTemplate(Tag(attrs, children));
        return tmpl.content.firstElementChild;
    }
    
    Comp.tag = Tag;
    Comp.Class = ComponentClass;

    return Comp;
}
