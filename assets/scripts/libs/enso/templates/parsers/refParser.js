
import { parser } from "../parser.js";
import { isAttr } from "./utils.js";

// Reference Attribute (#ref) parser
parser.registerAttr({
    type: 'ref',

    match(node, attribute) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            isAttr(attribute, '#')
        );
    },

    preprocess(def, node, attribute) {
        def.ref = attribute.value;
        node.removeAttribute(attribute.name);
        return true;
    },

    process(def, parent, element) {
        if (def.ref) {
            Object.defineProperty(parent.component.refs, def.ref, {
                value: element,
                writable: false,
                configurable: false,
            });
        }
    }

});
