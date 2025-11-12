
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
console.log('Loading', import.meta.url);

import { parser } from "../parser.js";
import { getName, isAttr, addBinding, bindSource } from "./utils.js";
import { Effect, Action, compileValue} from "../../core/effects.js";


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
parser.registerAttr({
    type: 'attr',

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
            bindSource(attribute.value, binds)
        );
        def.addAttribute(
            name,
            new Action(source, {name}, AttrEffect),
            binds
        );
        node.removeAttribute(attribute.name);
        def.attachParser(this);

        return true;
    },

    process(def, parent, element) {
        if (def.attributes) {
            for (const attr of def.attributes) { 
                //CREATE EFFECT
                // const action = {element, action: attr.action};
                const effect = attr.action.createEffect(parent, element);
                // Attach effect to all bindings
                for (const bind of attr.binds) {
                    addBinding(parent, bind, effect); //<-- EFFECT CLASS HERE
                }
            }
        }
    }

});