
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { parser } from "../parser.js";
import { EnsoFragment } from "../../core/fragment.js";
import { addBinding, bindSource, getDirective } from "./utils.js";
import { parseFor, createForFunction } from "./forUtils.js";
import { Action } from "../../core/effects.js";
import { ROOT, CHILDREN, ANCHOR, ENV } from "../../core/symbols.js";


class ItemFragment extends EnsoFragment {
    constructor(parent, template, item) {
        super(parent);
        this[ENV] = item;
        this._processTemplate(template);
    }
    mount(anchor) {
        if (anchor) {
            anchor.before(this[ROOT]);
        }
        super.mount(false);
    }
}

class ForFragment extends EnsoFragment {
    #effect;
    #template;
    constructor(parent, template, placeholder, action) {
        super(parent, null, placeholder);
        this.#effect = action.createEffect(parent, this[ROOT]);
        this.#template = template;
    }
    get tag() { return "enso:for"; }

    isAttached() { return this[CHILDREN].length > 0; }

    run() {
        const iterator = this.#effect.run();
        // Clear children list
        let child = this[CHILDREN].pop();
        while (child) {
            child.unmount();
            child = this[CHILDREN].pop();
        }

        for (const item of iterator) {
            // Copy template to a new ItemFragment
            const child = new ItemFragment(
                this, this.#template, item
            );
            // Mount
            child.mount(this[ANCHOR]);
        }
    }
}

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

