
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
        return function (env, el) {
            const show = fn.call(this, env);
            if (show) {
            }
            else {
            }   
        }
    },

    preprocess(def, node) {
        // Ensuire only one directive per node, and correct directive
        const directive = getDirective(node);
        if (!directive || directive.name !== '*if') return false;

        // Create a placeholder to mark the location of the node
        const id = `enso-${def.index}-${uuid()}`;
        const placeholder = createPlaceholder(id);
        node.replaceWith(placeholder);

        // Parse the directive expression
        const binds = new Set();

        getBindings(directive.value, );
            // Generate effect
        
        // Attach to node definition

        // Create a new template from the node
        def.fragment = new EnsoTemplate(node);

    },

    process(def, component, element) {

    }
});