
import { parser } from "../parser.js";
import { getName } from "./utils.js";
import { createEffect } from "../../utils/effects.js";

import { ENV } from "../../core/symbols.js";

// Event Attribute (@<event name>) parser
parser.register({

    match(node, attribute) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            attribute.name[0] === '@'
        );
    },

    createEventHandler(code) {
        return createEffect(code);
    },

    preprocess(def, node, attribute) {
        const event = {
            name: getName(attribute), 
            value: this.createEventHandler(attribute.value)
        };

        if (!def.events) def.events = [ event ];
        else def.events.push( event );
        node.removeAttribute(attribute.name);

        return true;
    },

    process(def, component, element) {
        if (def.events?.length) {
            for (const event of def.events) {
                const handler = event.value.call(component, component[ENV]).bind(component);
                element.addEventListener( event.name, handler );
            }
        }
    }

});