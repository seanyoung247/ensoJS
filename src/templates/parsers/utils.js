
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { ADD_BINDING, SCHEDULE_EFFECT } from "../../core/symbols.js";
import { lifecycle } from "../../component.js";

//// ATTRIBUTES

export const getName = (attr, prefixLen = 1) => {
    const name = attr.name;

    if (name.startsWith('enso-')) {
        // Longform, e.g. enso-evt:click
        const idx = name.indexOf(':');
        if (idx > -1) return name.slice(idx + 1).toLowerCase();
    }

    // Default shorthand behaviour
    return name.slice(prefixLen).toLowerCase();
};

export const isAttr = (attribute, prefix, type = null) => {
    if (!attribute?.name) return false;
    const name = attribute.name;

    // Shorthand check
    if (name.startsWith(prefix)) return true;

    // Longform check, e.g. enso-evt:click
    if (type) {
        return name.startsWith(`enso-${type}:`);
    }

    return false;
};
//// BINDINGS

// Matches object property dependencies, i.e:
// this.watched.property (true path), 
// watched:property (namespaced) or
// @:property (shorthand)
const bindEx = /(?:this\.watched\.|watched:|@:)([A-Za-z_$][\w$]*)/g;
const refEx  = /(?:this\.refs\.|ref:|#:)([A-Za-z_$][\w$]*)/g;
/**
 * Collects bindings from a source string
 * @param {string} source 
 * @param {Set} set 
 */
export const getBindings = (source, set) => {
    let match;
    while ((match = bindEx.exec(source)) !== null) {
        set.add(match[1]);
    }
    set.add(lifecycle.mount);
};

/**
 * Collects bindings, and rewrites watched references to 
 * explicit: this.watched.prop access
 * @param {string} source 
 * @param {Set} set 
 * @returns {string}
 */
export const bindSource = (source, set = null) => {
    // Collect Watched bindings
    const ret = source.replace(bindEx, (_, prop) => {
        if (set) set.add(prop);
        return `this.watched.${prop}`;
    })
    // Collect References
    .replace(refEx, (_, prop) => (`this.refs.${prop}`));
    if (set) set.add(lifecycle.mount);    // All Effects need to run at mount
    return ret;
};

export const addBinding = (parent, bind, effect) => {
    parent[ADD_BINDING](bind, effect);
    // Schedule initial render
    parent[SCHEDULE_EFFECT](effect);
};

//// DIRECTIVES

export const createPlaceholder = () => {
    const el = document.createElement("template");
    return el;
};

export const getDirective = (node, short, long) => {
    if (!node) return null;

    const directive = node.getAttributeNode(short) ?? node.getAttributeNode(long);
    if (directive) {
        node.removeAttribute(directive.name);
    }
    return directive?.value ?? null;
};
