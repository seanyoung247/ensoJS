
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { getOperator } from "./utils.js";
import { parseFor, createForFunction } from "./forUtils.js";


export default function (register, ctx) {
    const {
        addBinding, parseSource,
        EnsoFragment, Action
    } = ctx;
    
    class ItemFragment extends EnsoFragment {
        constructor(parent, template, item) {
            super(parent);
            this._setENV(item);
            this._processTemplate(template);
        }
        mount() {
            this.isAttached = true;
            this._requestUpdate();
            this._getChildren();
            return this._getNodes();
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
            this._insertAfterAnchor(...elements);
            this.isAttached = true;
            this._requestUpdate();
        }

        unmount() {
            for (const child of this._getChildFragments()) {
                child.unmount();
            }
            this._getChildFragments().length = 0;
            this.isAttached = false;
        }
    }

    // *for="item in/of items"
    register.generator({
        type: 'enso:for',

        match(node) {
            return (
                node.nodeType === Node.ELEMENT_NODE &&
                (node.hasAttribute('*for') || 
                    node.hasAttribute('enso-for'))
            );
        },

        preprocess(def, node) {
            if (def.getGenerator()) return false;

            const binds = new Set();
            const source = parseSource(
                getOperator(node, '*for', 'enso-for'),
                binds
            );
            const identifiers = parseFor(source);
            const action = new Action(
                createForFunction(source, identifiers),
            );

            // Create new nodedef for the for directive.
            const forDef = def.map.createRoot(node);
            forDef.setGenerator(this, {
                type: 'for', 
                action, 
                binds, 
                template: null
            });
            
            return true;
        },

        fragment(def, template) {
            def.getGenerator().data.template = template;
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
    });
}
