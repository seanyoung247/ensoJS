
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { parser } from "../parser.js";
import { getName, isAttr } from "./utils.js";
import { createEffect } from "../../core/effects.js";

import { ENV } from "../../core/symbols.js";


function createEventHandler(code) {
    return createEffect(code);
}

function attachEventListener(component, element, event) {

    let handler;
    try {
        handler = event.func.call(component, component[ENV]);
        if (typeof handler !== 'function') {
            throw new Error(`Invalid event handler for event '${event.name}' on element ${element.tagName}\n`+
                `- event handler must be a function but got: ${typeof handler}`);
        }
        handler = handler.bind(component);
    } catch (e) {
        console.error('[Enso] - ',e);
        handler = () => { console.warn(`Invalid event handler for event '${event.name}'`) };
        handler = handler.bind(component);
    }
    element.addEventListener( event.name, handler );
}

// Event Attribute (@<event name>) parser
parser.registerAttr({
    type: 'event',

    match(node, attribute) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            isAttr(attribute, '@')
        );
    },

    preprocess(def, node, attribute) {
        const event = {
            name: getName(attribute),
            func: createEventHandler(attribute.value)
        };
        if (!def.events) def.events = [ event ];
        else def.events.push( event );

        node.removeAttribute(attribute.name);

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