
import { parser } from "../parser.js";
import { getBindings, isAttr } from "./utils.js";
import { getChildIndex } from "../../utils/dom.js";
import { runEffect, createEffect, createStringTemplate } from "../../core/effects.js";

// *if="<expression>"
parser.registerDirective({
    match(node, attribute) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            isAttr(attribute, '*if')
        );
    },

    preprocess(def, node, attribute) {
        if (def.fragment) {
            console.error('Multiple directives on a single node are not supported');
            return false;
        }
        def.fragment = 

    },

    process(def, component, element) {

    }
});