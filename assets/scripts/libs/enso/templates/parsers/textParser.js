
import { parser } from "../parser.js";
import { getBindings } from "./utils.js";
import { getChildIndex } from "../../utils/dom.js";
import { runEffect, createEffect, createStringTemplate } from "../../core/effects.js";

import { GET_BINDING } from "../../core/symbols.js";

const nodeEx = /({{(.|\n)*}})/;

// Textnode parser
parser.registerNode({

    match(node) {
        return (
            node.nodeType === Node.TEXT_NODE &&
            nodeEx.test(node.nodeValue)
        );
    },

    createEffect(code) {
        const fn = createEffect(code);
        return function (env, node) {
            const content = fn.call(this, env);
            if (content) {
                node.textContent = content;
            }
        };
    },

    preprocess(def, node) {
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
                    const binding = component[GET_BINDING](bind);
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