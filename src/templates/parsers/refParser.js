
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { getOperator } from "./utils.js";


export default function (register) {

    // Reference Attribute (#ref) parser
    register.generator({
        type: 'enso:ref',

        match(node) {
            return (
                node.nodeType === Node.ELEMENT_NODE &&
                (node.hasAttribute('#ref') || 
                    node.hasAttribute('enso-ref'))
            );
        },

        preprocess(def, node) {
            if (def.getGenerator()) return false;

            const ref = getOperator(node, '#ref', 'enso-ref');
            def.setGenerator(this, {type: 'ref', name: ref});
            def.markWatched();

            return true;
        },

        process(data, parent, element) {
            if (!data || data.type !== 'ref') return;

            if (!parent.isComponent) {
                console.warn(
                    `[Enso] #ref="${data.name}" ignored: refs are only supported on static elements (not inside *for or *if).`
                );
                return;
            }

            Object.defineProperty(parent.component.refs, data.name, {
                value: element,
                writable: false,
                configurable: false,
            });
        }

    });
}