
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { parser } from "../parser.js";
import { EnsoFragment } from "../../core/fragment.js";
import { addBinding, bindSource, getDirective } from "./utils.js";
import { parseFor, createForFunction } from "./forUtils.js";
import { Action } from "../../core/effects.js";
import { ROOT, CHILDREN, ADD_CHILD, ANCHOR } from "../../core/symbols.js";


class ItemFragment extends EnsoFragment {
    constructor(parent, template) {
        super(parent, template, null);
    }

    mount(anchor) {
        // Mount BEFORE Anchor
    }
}

class ForFragment extends EnsoFragment {
    #effect;
    #template;
    constructor(parent, template, placeholder, action) {
        super(parent, template, placeholder);
        this.#effect = action.createEffect(parent, this[ROOT]);
    }
    _processTemplate(template) { this.#template = template; }
    get tag() { return "enso:for"; }

    run() {
        const iterator = this.#effect.run();
        // Clear children list
        let child;
        while (child = this[CHILDREN].pop()) {
            child.unmount(); child = null;
        }

        for (const item of iterator) {
            console.log(item);
            // FOR EACH LIST ITEM
            // Copy template to a new ItemFragment
            const child = new ItemFragment(
                this, this.#template.cloneNode(true)
            );
            // Mount
            child.mount(this[ANCHOR]);
        }
    }
}



// function createForEffect(parent, generator) {
//     const test = item => {
//         console.log(item);
//     };
//     const fn = generator.call(parent, {});
//     return () => fn(test);
// }

// *for="item in items"
parser.registerNode({
    type: 'for',

    match(node) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            (node.hasAttribute('*for') || 
                node.hasAttribute('enso-for'))
        );
    },

    preprocess(def, node) {
        if (def.directive) return false;

        const binds = new Set();
        const source = bindSource(
            getDirective(node, '*for', 'enso-for'),
            binds
        );
        const identifiers = parseFor(source);
        const action = new Action(
            createForFunction(source, identifiers),
        );

        // Create new nodedef for the for directive.
        const forDef = def.map.createRoot(node);
        forDef.setDirective({type: 'for', action, binds});
        forDef.attachParser(this);
        
        return true;
    },

    process(def, parent, element) {
        if (def?.directive?.type === 'for') {
            const fragment = new ForFragment(
                parent, def.directive.template, element, def.directive.action
            );

            for (const bind of def.directive.binds) {
                addBinding(parent, bind, fragment);
            }
        }
    },
});

