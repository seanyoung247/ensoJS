
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
console.log('Loading', import.meta.url);

import { parser } from "../parser.js";
import { bindSource, getName, isAttr } from "./utils.js";
import { Action } from "../../core/effects.js";


function attachEventListener(component, element, event) {
    const { name, action } = event;

    try {
        const handler = action.createFunc(component);
        element.addEventListener(name, handler.bind(component));
    } catch (e) {
        console.error('[Enso] - ',e);
        element.addEventListener(name, () =>
            console.warn(`[Enso] Invalid handler for event '${name}'`)
        );
    }
}

// Event Attribute (@<event name>) parser
parser.registerAttr({
    type: 'event',

    match(node, attribute) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            isAttr(attribute, '@', 'evt')
        );
    },

    preprocess(def, node, attribute) {
        const source = bindSource(attribute.value);
        def.addEvent(
            getName(attribute),
            new Action(source)
        );
        node.removeAttribute(attribute.name);
        def.attachParser(this);

        return true;
    },

    process(def, parent, element) {
        const component = parent.component;
        if (def.events?.length) {
            for (const event of def.events) {
                attachEventListener(component, element, event);
            }
        }
    }

});
