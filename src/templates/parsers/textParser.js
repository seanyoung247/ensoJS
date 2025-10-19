
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { parser } from "../parser.js";
import { addBinding, bindSource } from "./utils.js";
import { getChildIndex } from "../../utils/dom.js";
import { createEffect, createStringTemplate } from "../../core/effects.js";

const nodeEx = /({{(.|\n)*}})/;


function createTextEffect(code) {
    code = createStringTemplate(code);
    const fn = createEffect(code);
    return function (env, {element}) {
        const content = fn.call(this, env);
        if (element && content) {
            element.textContent = content;
        }
    };
}

// Textnode parser
parser.registerNode({
    type: 'text',

    match(node) {
        return (
            node.nodeType === Node.TEXT_NODE &&
            nodeEx.test(node.nodeValue)
        );
    },

    preprocess(def, node) {
        const binds = new Set();
        const source = bindSource(node.nodeValue, binds);
        def.addContent(
            node.parentNode,
            getChildIndex(node.parentNode, node),
            createTextEffect(source),
            binds
        );
        def.attachParser(this);

        return true;
    },

    process(def, parent, element) {
        if (def.content) {
            for (const content of def.content) {
                const node = element.childNodes[content.index];
                const effect = {element: node, action: content.effect};
                // Attach effect to all bindings
                for (const bind of content.binds) {
                    addBinding(parent, bind, effect);
                }
            }
        }
    }
});
