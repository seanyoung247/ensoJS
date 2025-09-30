
import { parser } from "../parser.js"
import { getName, getBindings, isAttr } from "./utils.js";
import { createEffect, createStringTemplate } from "../../core/effects.js";

import { GET_BINDING } from "../../core/symbols.js";

// Attribute binding (:<attribute name>) parser
parser.registerAttr({
    type: 'attr',

    match(node, attribute) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            isAttr(attribute, ':')
        );
    },

    createEffect(attr, code) {
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
    },

    preprocess(def, node, attribute) {
        const name = getName(attribute);
        const effect = this.createEffect(name, 
            createStringTemplate(attribute.value)
        );
        const attr = {
            name, effect, binds: new Set()
        };

        getBindings(attribute.value, attr.binds);

        if (!def.attrs) def.attrs = [attr];
        else def.attrs.push(attr);

        node.removeAttribute(attribute.name);
        
        return true;
    },

    process(def, parent, element) {
        if (def.attrs) {
            for (const attr of def.attrs) {
                const effect = {element, action: attr.effect};
                // Attach effect to all bindings
                for (const bind of attr.binds) {
                    const binding = parent[GET_BINDING](bind);
                    if (binding) {
                        binding.effects.push(effect);
                        binding.changed = true;
                    }
                }
            }
        }
    }

});