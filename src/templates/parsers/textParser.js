
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { parser } from "../parser.js";
import { addBinding, bindSource } from "./utils.js";
import { getChildIndex } from "../../utils/dom.js";
import { Effect, Action, compileValue } from "../../core/effects.js";

const nodeEx = /({{(.|\n)*}})/;


class TextEffect extends Effect {
    run() {
        const content = super.run();
        console.log(this.element, content);
        if (this.element && content) {
            this.element.textContent = content;
        }
    }
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
        const source = compileValue(
            bindSource(node.nodeValue, binds)
        );
        def.addContent(
            node.parentNode,
            getChildIndex(node.parentNode, node),
            new Action(source, {}, TextEffect),
            binds
        );
        def.attachParser(this);

        return true;
    },

    process(def, parent, element) {
        console.log('Processing text node', def, parent, element);
        if (def.content) {
            for (const content of def.content) {
                const node = element.childNodes[content.index];
                const effect = content.action.createEffect(parent, node);
                // Attach effect to all bindings
                for (const bind of content.binds) {
                    addBinding(parent, bind, effect);
                }
            }
        }
    }
});
