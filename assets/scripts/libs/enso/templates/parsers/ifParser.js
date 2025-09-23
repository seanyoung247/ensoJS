
import { parser } from "../parser.js";
import { createPlaceholder, getDirective } from "./utils.js";
import { uuid } from "../../utils/uuid.js";
import { createEffect } from "../../core/effects.js";
import EnsoTemplate from "../templates.js";


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
                    // Mount effect.fragment here
                }
            } else {
                if (effect.element) {
                    // Unmount effect.fragment here 
                }
            }   
        }
    },

    preprocess(def, node) {
        // Ensuire only one directive per node, and correct directive
        const directive = getDirective(node);
        if (!directive || directive.name !== '*if') return false;

        // Create a placeholder to mark the location of the node
        const placeholder = `enso-${def.index}-${uuid()}`;
        node.replaceWith(createPlaceholder(placeholder));

        // Parse the directive expression
        const binds = new Set();
        getBindings(directive.value, binds);
        // Generate effect
        const effect = this.createEffect(directive.value);

        // Create a new template from the node
        const fragment = new EnsoTemplate(node);

        def.directive = {
            type: 'if', placeholder, fragment, effect, binds
        };
        
        return true;
    },

    process(def, component, element) {

    }
});