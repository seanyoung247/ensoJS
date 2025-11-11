
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { parser } from "../parser.js";
import { getDirective, addBinding, bindSource } from "./utils.js";
import { createAction, createStringTemplate, Effect } from "../../core/effects.js";
import { EnsoFragment } from "../../core/fragment.js";


class IfFragment extends EnsoFragment {
    #effect;
    constructor(parent, template, placeholder, action) {
        super(parent, template, placeholder);
        this.#effect = new Effect(parent, null, action);
    }

    get tag() { return "enso:if"; }

    run() {
        const show = this.#effect.run();
        if (show) {
            this.mount();
        } else {
            this.unmount();
        }
    }
}

function createConditionAction(code) {
    code = createStringTemplate(code);
    return createAction(code);
}

// *if="<expression>"
parser.registerNode({
    type: 'if',

    match(node) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            (node.hasAttribute('*if') || 
                node.hasAttribute('enso-if'))
        );
    },

    preprocess(def, node) {
        if (def.directive) return false;
        // get and ensure directive matches parser
        let directive = getDirective(node, '*if', 'enso-if');
        const binds = new Set();

        directive = bindSource(directive, binds);
        // const effect = createConditionEffect(directive);
        const action = createConditionAction(directive);

        // Create new nodedef for the if directive.
        const ifDef = def.map.createRoot(node);
        ifDef.setDirective({type: 'if', action, binds});
        ifDef.attachParser(this);

        return true;
    },

    process(def, parent, element) {
        if (def?.directive?.type === 'if') {
            console.log("Processing if directive", def.directive);
            const fragment = new IfFragment(
                parent, def.directive.template, element, def.directive.action
            );
            // const effect = {element: null, fragment, action: def.directive.effect};

            // Attach effect to all bindings
            for (const bind of def.directive.binds) {
                addBinding(parent, bind, fragment);
            }
        }
    }
});
