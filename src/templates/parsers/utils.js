
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
// Reference mapping -> this.refs.reference
// ref:property (namespace) or
// #:property (shorthand)
const refEx  = /(?:this\.refs\.|ref:|#:)([A-Za-z_$][\w$]*)/g;
/**
 * Collects bindings from a source string
 * @param {string} source 
 * @param {Set} set 
 */
export const collectBindings = (source, set) => {
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
export const parseSource = (source, set = null) => {
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

export const addWatcher = (parent, bind, fn) => {
    parent.watched._addWatcher(bind, fn);
    const value = parent.watched._getProp(bind);
    fn.call(parent, bind, value);
}

//// DIRECTIVES

export const createPlaceholder = () => {
    const el = document.createElement("template");
    return el;
};

export const getOperator = (node, short, long) => {
    if (!node) return null;

    const operator = node.getAttributeNode(short) ?? node.getAttributeNode(long);
    if (operator) {
        node.removeAttribute(operator.name);
    }
    return operator?.value ?? null;
};
