
import { parser } from "../parser.js";
import { createPlaceholder, getDirective } from "./utils.js";
import { uuid } from "../../utils/uuid.js";
import { runEffect, createEffect, createStringTemplate } from "../../core/effects.js";
import EnsoTemplate from "../templates.js";
import EnsoFragment from "../../core/fragment.js";

import { ROOT, ENV } from "../../core/symbols.js";

class IfFragment extends EnsoFragment {
    constructor(parent, template, placeholder) {
        super(parent, template, placeholder);
    }
}


// *if="<expression>"
parser.registerNode({
    match(node) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            node.hasAttribute('*if')
        );
    },

    createEffect(code) {
        const fn = createEffect(code);
        return function (env, effect) {
            const show = fn.call(this, env);
            if (show) {
                if (!effect.element) {
                    effect.fragment.mount();
                    effect.element = effect.fragment[ROOT];
                }
            } else {
                if (effect.element) {
                    effect.fragment.unmount();
                    effect.element = null;
                }
            }   
        }
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
        const effect = this.createEffect(
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
                }
            }
            // Initial render
            runEffect(parent.component, parent[ENV], effect);
        }
    }
});
