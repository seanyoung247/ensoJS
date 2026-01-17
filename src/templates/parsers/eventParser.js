
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { parser } from "../parser.js";
import { bindSource, getName, isAttr } from "./utils.js";
import { Action } from "../../core/effects.js";


function attachEventListener(parent, element, event) {
    const { name, action } = event;

    try {
        const handler = action.createFunc(parent);
        element.addEventListener(
            name.toLowerCase(), handler.bind(parent.component)
        );
    } catch (e) {
        console.error('[Enso] - ',e);
        element.addEventListener(name.toLowerCase(), () =>
            console.warn(`[Enso] Invalid handler for event '${name}'`)
        );
    }
}

// Event Attribute (@<event name>) parser
parser.registerMutator({
    type: 'event',

    match(node, attribute) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            isAttr(attribute, '@', 'evt')
        );
    },

    preprocess(def, node, attribute) {
        const source = bindSource(attribute.value);
        def.addMutator(this, {
            name: getName(attribute),
            action: new Action(source)
        });
        node.removeAttribute(attribute.name);

        return true;
    },

    process(data, parent, element) {
        for (const event of data) {
            attachEventListener(parent, element, event);
        }
    }

});
