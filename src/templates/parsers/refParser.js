
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { parser } from "../parser.js";
import { getOperator } from "./utils.js";

// Reference Attribute (#ref) parser
parser.registerOperator({
    type: 'ref',

    match(node) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            (node.hasAttribute('#ref') || 
                node.hasAttribute('enso-ref'))
        );
    },

    preprocess(def, node) {
        if (def.getOperator()) return false;

        const ref = getOperator(node, '#ref', 'enso-ref');
        def.setOperator(this, {type: 'ref', name: ref});

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
