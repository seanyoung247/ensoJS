
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { getName, isAttr } from "./utils.js";


export default function (register, ctx) {

    const {
        addBinding, parseSource, 
        Effect, Action, compileValue
    } = ctx;

    class AttrEffect extends Effect {
        #attr;
        constructor(parent, element, action) {
            super(parent, element, action);
            this.#attr = action.data.name;
        }

        run() {
            const content = super.run();
            const el = this.element;
            if (content) {
                el.setAttribute(this.#attr, (content === true) ? '' : content);
            }
            else {
                el.removeAttribute(this.#attr);
            }
        }
    }

    // Attribute binding (:<attribute name>) parser
    register.attribute({
        type: 'enso:attr',

        match(node, attribute) {
            return (
                node.nodeType === Node.ELEMENT_NODE &&
                isAttr(attribute, ':', 'attr')
            );
        },

        preprocess(def, node, attribute) {
            const name = getName(attribute);
            const binds = new Set();
            const source = compileValue(
                parseSource(attribute.value, binds)
            );
            def.addMutator(this, {
                name, 
                action: new Action(source, {name}, AttrEffect),
                binds
            });
            node.removeAttribute(attribute.name);

            return true;
        },

        process(data, parent, element) {
            for (const attr of data) { 
                const effect = attr.action.createEffect(parent, element);
                // Attach effect to all bindings
                for (const bind of attr.binds) {
                    addBinding(parent, bind, effect);
                }
            }
        }

    });
}