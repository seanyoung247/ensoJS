
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { parser } from "../parser.js";
import { getName, getBindings, isAttr, addBinding } from "./utils.js";
import { createEffect, createStringTemplate } from "../../core/effects.js";

function createAttrEffect(attr, code) {
    code = createStringTemplate(code);
    const fn = createEffect(code);
    return function (env, { element: el }) {
        const content = fn.call(this, env);
        if (content) {
            el.setAttribute(attr, (content === true) ? '' : content);
        }
        else {
            el.removeAttribute(attr);
        }
    };
}

// Attribute binding (:<attribute name>) parser
parser.registerAttr({
    type: 'attr',

    match(node, attribute) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            isAttr(attribute, ':')
        );
    },

    preprocess(def, node, attribute) {
        const name = getName(attribute);
        const effect = createAttrEffect(name, attribute.value);
        const binds = new Set();

        getBindings(attribute.value, binds);
        def.addAttribute(name, effect, binds);
        node.removeAttribute(attribute.name);
        def.attachParser(this);

        return true;
    },

    process(def, parent, element) {
        if (def.attributes) {
            for (const attr of def.attributes) {
                const effect = {element, action: attr.effect};
                // Attach effect to all bindings
                for (const bind of attr.binds) {
                    addBinding(parent, bind, effect);
                }
            }
        }
    }

});