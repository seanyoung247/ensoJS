
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { parser } from "../parser.js";

// Reference Attribute (#ref) parser
parser.registerAttr({
    type: 'ref',

    match(node, attribute) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            (attribute.name === '#ref' || 
                attribute.name === 'enso-ref')
        );
    },

    preprocess(def, node, attribute) {
        def.ref = attribute.value;
        node.removeAttribute(attribute.name);
        def.attachParser(this);

        return true;
    },

    process(def, parent, element) {
        if (!def.ref) return;

        if (!parent.isComponent) {
            console.warn(
                `[Enso] #ref="${def.ref}" ignored: refs are only supported on static elements (not inside *for or *if).`
            );
            return;
        }

        Object.defineProperty(parent.component.refs, def.ref, {
            value: element,
            writable: false,
            configurable: false,
        });
    }

});
