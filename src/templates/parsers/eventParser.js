
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { getName, isAttr } from "./utils.js";


export default function register(register, ctx) {
    const { Action, parseSource } = ctx;

    function attachEventListener(parent, element, event) {
        const { name, action } = event;

        try {
            const handler = action.createFunc(parent);
            element.addEventListener(
                name.toLowerCase(), handler.bind(parent.component)
            );
        } catch (e) {
            /* v8 ignore next */
            console.error('[Enso] - ',e);
        }
    }

    // Event Attribute (@<event name>) parser
    register.attribute({
        type: 'enso:event',

        match(node, attribute) {
            return (
                node.nodeType === Node.ELEMENT_NODE &&
                isAttr(attribute, '@', 'evt')
            );
        },

        preprocess(def, node, attribute) {
            const source = parseSource(attribute.value);
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
}
