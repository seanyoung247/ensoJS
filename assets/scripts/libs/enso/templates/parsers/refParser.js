
import { parser } from "../parser.js";

// Reference Attribute (#ref) parser
parser.register('#', {

    preprocess(def, node, attribute) {
        def.parsers.push(this);
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
