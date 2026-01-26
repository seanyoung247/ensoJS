
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { getChildIndex } from "../../utils/dom.js";


export default function (register, ctx) {
    const {
        addBinding, parseSource,
        Effect, Action, compileValue
    } = ctx;
    const nodeEx = /({{(.|\n)*}})/;

    class TextEffect extends Effect {
        run() {
            const content = super.run();
            /* v8 ignore next */
            if (this.element && content) {
                this.element.textContent = content;
            }
        }
    }

    // Textnode parser
    register.content({
        type: 'enso:text',

        match(node) {
            return (
                node.nodeType === Node.TEXT_NODE &&
                nodeEx.test(node.nodeValue)
            );
        },

        preprocess(def, node) {
            const binds = new Set();
            const source = compileValue(
                parseSource(node.nodeValue, binds)
            );
            def.addMutator(this, {
                parent: node.parentNode,
                index: getChildIndex(node.parentNode, node),
                action: new Action(source, {}, TextEffect),
                binds
            });

            return true;
        },

        process(data, parent, element) {
            for (const text of data) { 
                const node = element.childNodes[text.index];
                const effect = text.action.createEffect(parent, node);
                // Attach effect to all bindings
                for (const bind of text.binds) {
                    addBinding(parent, bind, effect);
                }
            }
        }
    });
}
