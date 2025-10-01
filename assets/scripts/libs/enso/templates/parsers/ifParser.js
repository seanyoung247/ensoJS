
import { parser } from "../parser.js";
import { uuid } from "../../utils/uuid.js";
import { createPlaceholder, getDirective, getBindings } from "./utils.js";
import { createEffect, createStringTemplate } from "../../core/effects.js";
import { EnsoFragment } from "../../core/fragment.js";
import EnsoTemplate from "../templates.js";

import { ROOT, ENV, GET_BINDING } from "../../core/symbols.js";

class IfFragment extends EnsoFragment {
    constructor(parent, template, placeholder) {
        super(parent, template, placeholder);
    }
    get tag() { return "enso:if"; }
}

function createConditionEffect(code) {
    const fn = createEffect(code);
    return function (env, effect) {
        const show = fn.call(this, env);

        if (show) {
            effect.fragment.mount();
            effect.element = effect.fragment[ROOT];
        } else {
            effect.fragment.unmount();
            effect.element = null;
        }   
    }
}

// *if="<expression>"
parser.registerNode({
    type: 'if',

    match(node) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            node.hasAttribute('*if')
        );
    },

    preprocess(def, node) {
        // Ensuire only one directive per node, and ensure directive matches parser
        const directive = getDirective(node);
        if (!directive || directive.name !== '*if') return false;

        // Create a placeholder to mark the location of the node
        const placeholder = `enso-${def.index}-${uuid()}`;
        def.node = createPlaceholder(placeholder);
        node.replaceWith(def.node);

        // Parse the directive expression
        const binds = new Set();
        getBindings(directive.value, binds);
        // Generate effect
        const effect = createConditionEffect(
            createStringTemplate(directive.value)
        );

        // Create a new template from the node
        const fragment = new EnsoTemplate(node);

        def.directive = {
            type: 'if', placeholder, fragment, effect, binds
        };
        
        return true;
    },

    process(def, parent, element) {
        if (def?.directive?.type === 'if' && element.id === def.directive.placeholder) {
            const fragment = new IfFragment(
                parent, def.directive.fragment, element
            );
            const effect = {element: null, fragment, action: def.directive.effect};
            // Attach effect to all bindings
            for (const bind of def.directive.binds) {
                const binding = parent[GET_BINDING](bind);
                if (binding) {
                    binding.effects.push(effect);
                    binding.changed = true;
                }
            }
        }
    }
});
