
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { EnsoFragment } from "../../core/fragment.js";
import { addBinding, bindSource, getOperator } from "./utils.js";
import { parseFor, createForFunction } from "./forUtils.js";
import { Action } from "../../core/effects.js";
import { NODES, CHILDREN, UPDATE, ENV, ANCHOR } from "../../core/symbols.js";


class ItemFragment extends EnsoFragment {
    constructor(parent, template, item) {
        super(parent);
        this[ENV] = item;
        this._processTemplate(template);
    }
    mount() {
        this.isAttached = true;
        this[UPDATE]();
        this._getChildren();
        return this[NODES];
    }
}

class ForFragment extends EnsoFragment {
    #effect;
    #template;
    constructor(parent, template, placeholder, action) {
        super(parent, null, placeholder);
        this.#effect = action.createEffect(parent, null);
        this.#template = template;
    }
    get tag() { return "enso:for"; }

    run() {
        this.mount();
    }

    mount() {
        // Clear children list
        this.unmount();
        // Construct new items
        const elements = [];
        const iterator = this.#effect.run();
        for (const item of iterator) {
            // Copy template to a new ItemFragment
            const child = new ItemFragment(
                this, this.#template, item
            );
            // Mount
            elements.push(...child.mount());
        }
        this[ANCHOR].after(...elements);
        this.isAttached = true;
        this[UPDATE]();
    }

    unmount() {
        for (const child of this[CHILDREN]) {
            child.unmount();
        }
        this[CHILDREN].length = 0;
        this.isAttached = false;
    }
}

export default function register(parser) {
    // *for="item in/of items"
    parser.register({
        type: 'for',

        match(node) {
            return (
                node.nodeType === Node.ELEMENT_NODE &&
                (node.hasAttribute('*for') || 
                    node.hasAttribute('enso-for'))
            );
        },

        preprocess(def, node) {
            if (def.getOperator()) return false;

            const binds = new Set();
            const source = bindSource(
                getOperator(node, '*for', 'enso-for'),
                binds
            );
            const identifiers = parseFor(source);
            const action = new Action(
                createForFunction(source, identifiers),
            );

            // Create new nodedef for the for directive.
            const forDef = def.map.createRoot(node);
            forDef.setOperator(this, {
                type: 'for', 
                action, 
                binds, 
                template: null
            });
            
            return true;
        },

        fragment(def, template) {
            def.getOperator().data.template = template;
        },
        
        process(data, parent, element) {
            if (data?.type === 'for') {
                const fragment = new ForFragment(
                    parent, data.template, element, data.action
                );

                for (const bind of data.binds) {
                    addBinding(parent, bind, fragment);
                }
            }
        },
    }, 'generator');
}
