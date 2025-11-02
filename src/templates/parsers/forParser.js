
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { parser } from "../parser.js";
import { EnsoFragment } from "../../core/fragment.js";
import { addBinding, bindSource, getDirective } from "./utils.js";
import { parseFor, createForFunction } from "./forUtils.js";
import { createEffect } from "../../core/effects.js";
// import { ENV } from "../../core/symbols.js";


class ForFragment extends EnsoFragment {
    constructor(parent, template, placeholder) {
        super(parent, template, placeholder);
    }
    get tag() { return "enso:for"; }
}

// class ItemFragments extends EnsoFragment {
//     constructor(parent, template, placeholder) {
//         super(parent, template, placeholder);
//     }
// }

function createForEffect(parent, generator) {
    const test = item => {
        console.log(item);
    };
    const fn = generator.call(parent, {});
    return () => fn(test);
}

// *for="{{ item in items }}"
parser.registerNode({
    type: 'for',

    match(node) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            (node.hasAttribute('*for') || 
                node.hasAttribute('enso-for'))
        );
    },

    preprocess(def, node) {
        if (def.directive) return false;

        const binds = new Set();
        const source = bindSource(
            getDirective(node, '*for', 'enso-for'),
            binds
        );
        // Get identifiers
        const identifiers = parseFor(source);
        // Create effect
        const effect = createEffect(
            createForFunction(source, identifiers[0])
        );

        // Create new nodedef for the for directive.
        const forDef = def.map.createRoot(node);
        forDef.setDirective({type: 'for', effect, binds});
        forDef.attachParser(this);
        
        return true;
    },

    process(def, parent, element) {
        if (def?.directive?.type === 'for') {
            const fragment = new ForFragment(
                parent, def.directive.template, element
            );
 
            const effect = { 
                element: null, 
                fragment, 
                action: createForEffect(parent, def.directive.effect)
            };

            for (const bind of def.directive.binds) {
                addBinding(parent, bind, effect);
            }
        }
    },
});

