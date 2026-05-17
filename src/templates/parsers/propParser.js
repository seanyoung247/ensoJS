
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { getName, isAttr } from "./utils.js";


export default function (register, ctx) {
    const {
        parseSource, addWatcher,
        Effect, Action
    } = ctx;

    const compileValue = code => (
        /*js*/
        `(()=>${code
            .replaceAll('{{', '')
            .replaceAll('}}', '')
            .trim()})`
    );

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
    register.attribute({
        type: 'enso:prop',

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
                parseSource(attribute.value, binds)
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
            const component = parent.component;
            for (const prop of data) { 
                const effect = prop.action.createEffect(parent, element);
                for (const bind of prop.binds) {
                    addWatcher(component, bind, ()=>effect.run());
                }
            }
        }
    });
}
