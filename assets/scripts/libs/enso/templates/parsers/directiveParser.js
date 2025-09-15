
import { parser } from "../parser.js";
import { getBindings } from "./utils.js";
import { getChildIndex } from "../../utils/dom.js";
import { runEffect, createEffect, createStringTemplate } from "../../core/effects.js";

// *if="<expression>"
parser.register({
    match(node, attribute) {
        return (
            node.tagName === 'ENSO-IF' &&
            attribute.name === '*if'
        );
    },

    preprocess(def, node, attribute) {
    },

    process(def, component, element) {

    }
});