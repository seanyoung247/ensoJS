
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { parser } from "../parser.js";
import { getName, isAttr, addBinding, bindSource } from "./utils.js";
import { Effect, Action, compileValue } from "../../core/effects.js";

class PropEffect extends Effect {
    #prop;
    constructor(parent, element, action) {
        super(parent, element, action);
        this.#prop = action.data.name;
    }

    run() {
        const content = super.run();
        this.element[this.#prop] = content;
    }
}

// Property binding (.:<property name>) parser
parser.registerAttr({
    type: 'prop',

    match(node, attribute) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            isAttr(attribute, '.','prop')
        );
    },

    preprocess(def, node, attribute) {
        const name = getName(attribute);
        const binds = new Set();
        const source = compileValue(
            bindSource(attribute.value, binds)
        );
        def.addAttribute(
            name,
            new Action(source, {name}, PropEffect),
            binds
        );
        node.removeAttribute(attribute.name);
        def.attachParser(this);

        return true;
    },

    process(def, parent, element) {
        if (def.attributes) {
            for (const attr of def.attributes) { 
                const effect = attr.action.createEffect(parent, element);
                addBinding(attr.binds, effect);
                effect.run();
            }
        }
    }
});
