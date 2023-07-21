
import { parser } from "../parser.js";
import { createEffect } from "../../utils/effects.js";

// Event Attribute (@<event name>) parser
parser.register('@', {

    createEventHandler(code) {
        return createEffect(code);
    },

    preprocess(def, node, attribute) {
        const event = {
            name: getName(attribute), 
            value: this.createEventHandler(attribute.value)
        };
        def.parsers.push(this);

        if (!def.events) def.events = [ event ];
        else def.events.push( event );
        node.removeAttribute(attribute.name);

        return true;
    },

    process(def, component, element) {
        if (def.events?.length) {
            for (const event of def.events) {
                const handler = event.value.call(component, component.env).bind(component);
                element.addEventListener( event.name, handler );
            }
        }
    }

});