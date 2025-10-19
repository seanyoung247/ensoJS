
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { ADD_BINDING, SCHEDULE_EFFECT, SETUP } from "../../core/symbols.js";

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

// Matches object property dependencies, i.e. this.<property>:
const bindEx = /(?:this\.)?watched\.(\w+)/gi;

export const getBindings = (source, set) => {
    let bind;
    while ((bind = bindEx.exec(source)) !== null) {
        set.add(bind[1]);
    }
    // If no bindings found, bind as a startup effect.
    if (set.size === 0) set.add(SETUP);
};
export const bindSource = (source, set = null) => {
    const ret = source.replace(bindEx, (_match, prop) => {
        if (set) set.add(prop);         // collect the binding
        return `this.watched.${prop}`;  // rewrite reference
    });
    // If no bindings found, bind as a startup effect.
    if (set && set.size === 0) set.add(SETUP);
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

export const getDirective = (node, prefix='*') => {
    if (!node?.attributes) return null;

    let directive = null;
    for (const attr of [...node.attributes]) {
        if (attr.name.startsWith(prefix)) {
            // Only one directive per node is supported
            if (!directive) directive = attr;
            node.removeAttribute(attr.name);
        }
    }

    return directive;
};

