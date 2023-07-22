
import { parser } from "../parser.js";
import { getBindings } from "./utils.js";
import { getChildIndex } from "../../utils/dom.js";
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
        // Indicates that this parser is needed to processes this node
        def.parsers.push(this);
        const content = {
            parent: node.parentNode,
            index: getChildIndex(node.parentNode, node),
            effect: this.createEffect(
                createStringTemplate(node.nodeValue)
            ),
            binds: new Set()
        };

        if (!def.content) def.content = [content];
        else def.content.push(content);
        const current = def.content.length - 1;

        getBindings(node.nodeValue, def.content[current].binds);

        return true;
    },

    process(def, component, element) {
        
        if (def.content) {
            for (const content of def.content) {
                const node = element.childNodes[content.index];
                for (const bind of content.binds) {
                    const binding = component.getBinding(bind);
                    if (binding) {
                        binding.effects.push({ element: node, action: content.effect });
                    }
                }
                // Initial render
                runEffect(content.effect, component, node);
            }
        }
    }

});