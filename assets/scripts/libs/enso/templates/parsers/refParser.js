
import { parser } from "../parser.js";
import { isAttr } from "./utils.js";

// Reference Attribute (#ref) parser
parser.registerAttribute({

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

    process(def, component, element) {
        if (def.ref) {
            Object.defineProperty(component.refs, def.ref, {
                value: element,
                writable: false,
                configurable: false,
            });
        }
    }

});
