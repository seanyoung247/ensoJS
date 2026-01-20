
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
// import { parser } from "../parser.js";
import { getName, isAttr, /*addBinding, bindSource*/ } from "./utils.js";
// import { Effect, Action } from "../../core/effects.js";
import { registerMutator } from "./test.js";


const compileValue = code => (
    /*js*/
    `(()=>${code
        .replaceAll('{{', '')
        .replaceAll('}}', '')
        .trim()})`
);

registerMutator(ctx => {
    const { addBinding, bindSource, Action, Effect } = ctx;

    class PropEffect extends Effect {
        #prop;
        constructor(parent, element, action) {
            super(parent, element, action);
            this.#prop = action.data.name;
        }

        run() {
            const content = super.run();
            if (content !== undefined) {
                this.element[this.#prop] = content;
            }
        }
    }

    // Property binding (.:<property name>) parser
    return {
        type: 'prop',

        match(node, attribute) {
            return (
                node.nodeType === Node.ELEMENT_NODE &&
                isAttr(attribute, '.', 'prop')
            );
        },

        preprocess(def, node, attribute) {
            const name = getName(attribute);
            const binds = new Set();
            const source = compileValue(
                bindSource(attribute.value, binds)
            );
            def.addMutator(this, {
                name,
                action: new Action(source, {name}, PropEffect),
                binds
            });
            node.removeAttribute(attribute.name);

            return true;
        },

        process(data, parent, element) {
            for (const prop of data) { 
                const effect = prop.action.createEffect(parent, element);
                for (const bind of prop.binds) {
                    addBinding(parent, bind, effect);
                }
            }
        }
    };
});
