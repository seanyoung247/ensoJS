
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { getOperator } from "./utils.js";


export default function register(register, ctx) {
    const {
        addBinding, parseSource,
        compileValue, Action,
        EnsoFragment
    } = ctx;

    class IfFragment extends EnsoFragment {
        #effect;
        constructor(parent, template, placeholder, action) {
            super(parent, template, placeholder);
            this.#effect = action.createEffect(parent, null);
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

    // *if="{{ <expression> }}"
    register.generator({
        type: 'enso:if',

        match(node) {
            return (
                node.nodeType === Node.ELEMENT_NODE &&
                (node.hasAttribute('*if') || 
                    node.hasAttribute('enso-if'))
            );
        },

        preprocess(def, node) {
            if (def.getGenerator()) return false;
            // get and ensure directive matches parser
            let directive = getOperator(node, '*if', 'enso-if');
            const binds = new Set();

            directive = parseSource(directive, binds);
            const action = new Action(compileValue(directive));

            // Create new nodedef for the if directive.
            const ifDef = def.map.createRoot(node);
            ifDef.setGenerator(this, {
                type: 'if', 
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
            if (data?.type === 'if') {
                const fragment = new IfFragment(
                    parent, data.template, element, data.action
                );

                // Attach effect to all bindings
                for (const bind of data.binds) {
                    addBinding(parent, bind, fragment);
                }
            }
        }
    });
}
