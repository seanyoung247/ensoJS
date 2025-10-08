
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { GET_BINDING, SCHEDULE_EFFECT } from "../../core/symbols.js";

// Matches object property dependencies, i.e. this.<property>:
const bindEx = /(?:this\.)(\w+|\d*)/gi;

export const getName = (attr, prefixLen = 1) => attr.name.slice(prefixLen).toLowerCase();
export const getBindings = (source, set) => {
    let bind;
    while ((bind = bindEx.exec(source)) !== null) {
        set.add(bind[1]);
    }
};

export const addBinding = (parent, bind, effect) => {
    const binding = parent[GET_BINDING](bind);
    if (binding) {
        binding.effects.push(effect);
        binding.changed = true;
        parent[SCHEDULE_EFFECT](effect);
    }
};

export const isAttr = (attribute, prefix) => (
    attribute?.name?.startsWith(prefix) ?? false
);

export const createPlaceholder = () => {
    const el = document.createElement("template");
    return el;
}

export const getDirective = (node, prefix='*') => {
    if (!node.attributes) return null;

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

