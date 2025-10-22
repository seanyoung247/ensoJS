
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { parser } from "../parser.js";
import { getDirective, addBinding, bindSource } from "./utils.js";
import { createEffect, createStringTemplate } from "../../core/effects.js";
import { EnsoFragment } from "../../core/fragment.js";

import { ROOT } from "../../core/symbols.js";

class IfFragment extends EnsoFragment {
    constructor(parent, template, placeholder) {
        super(parent, template, placeholder);
    }
    get tag() { return "enso:if"; }
}

function createConditionEffect(code) {
    code = createStringTemplate(code);
    const fn = createEffect(code);

    return function (env, effect) {
        let show;
        show = fn.call(this, env);
        if (show) {
            effect.fragment.mount();
            effect.element = effect.fragment[ROOT];
        } else {
            effect.fragment.unmount();
            effect.element = null;
        }   
    };
}

// *if="<expression>"
parser.registerNode({
    type: 'if',

    match(node) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            (node.hasAttribute('*if') || 
                node.hasAttribute('enso-if'))
        );
    },

    preprocess(def, node) {
        // Ensuire only one directive per node, and ensure directive matches parser
        let directive = getDirective(node, '*if', 'enso-if');
        if (def.directive) return false;

        const binds = new Set();

        directive = bindSource(directive, binds);
        const effect = createConditionEffect(directive);

        // Create new nodedef for the if directive.
        const ifDef = def.map.createRoot(node);
        ifDef.setDirective({type: 'if', effect, binds});
        ifDef.attachParser(this);

        return true;
    },

    process(def, parent, element) {
        if (def?.directive?.type === 'if') {
            const fragment = new IfFragment(
                parent, def.directive.template, element
            );
            const effect = {element: null, fragment, action: def.directive.effect};

            // Attach effect to all bindings
            for (const bind of def.directive.binds) {
                addBinding(parent, bind, effect);
            }
        }
    }
});
