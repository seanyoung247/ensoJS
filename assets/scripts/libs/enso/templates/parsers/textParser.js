
import { parser } from "../parser.js";
import { getBindings } from "./utils.js";
import { runEffect, createEffect, createStringTemplate } from "../../utils/effects.js";

// Textnode parser
parser.register('TEXT', {

    createEffect(code) {
        const fn = createEffect(code);
        return function (env, el) {
            const content = fn.call(this, env);
            if (content) {
                el.textContent = content;
            }
        };
    },

    preprocess(def, node) {
        const span = document.createElement('span');
        // Indicates that this parser is needed to processes this node
        def.parsers.push(this);
        def.content = {
            effect: this.createEffect(
                createStringTemplate(node.nodeValue)
            ),
            binds: new Set()
        };
        node.parentNode.replaceChild(span, node);

        getBindings(node.nodeValue, def.content.binds);

        return span;
    },

    process(def, component, element) {
        if (def.content) {
            for (const bind of def.content.binds) {
                const binding = component.getBinding(bind);
                if (binding) binding.effects.push({ element, action: def.content.effect });
            }
            // Initial render
            runEffect(def.content.effect, component, element);
        }
    }

});