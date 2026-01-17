/**
 * @module parser - Template parser and processor
 */

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { ENSO_NODE, ENSO_PARSED, ENSO_ROOT } from "../core/symbols.js";

export const parser = (() => {
    const operatorParsers = [];
    const mutatorParsers = [];
    const nodeParsers = [];

    return Object.freeze({
        /**
         * Register a new template directive parser
         * @param {Object} parser   - Directive parser code implementation
         */
        registerOperator(parser) {
            operatorParsers.push(parser);
        },
        /**
         * Register a new template attribute parser
         * @param {Object} parser   - Attribute parser code implementation
         */
        registerMutator(parser, target = 'attr') {
            if (target === 'node') {
                nodeParsers.push(parser);
                return;
            }
            mutatorParsers.push(parser);
        },

        /**
         * Find a directive for this node
         * @param {Node} node       - The node to parse
         * @returns {Object}        - The directive requested
         */
        getOperatorParser(node) {
            for (const parser of operatorParsers) {
                if (parser.match(node)) return parser;
            }
            return null;
        },

        /**
         * Returns a Parser identified by the id
         * @param {Node} node       - The node to parse
         * @param {Attr} attribute  - The Attribute node to parse     
         * @returns {Object}        - The parser requested
         */
        getMutatorParser(node, attribute) {
            for (const parser of mutatorParsers) {
                if (parser.match(node, attribute)) return parser;
            }
            return null;
        },

        /**
         * Tags a node as the root of an enso template/fragment
         * @param {HTMLElement} element - Root node
         */
        markRoot(element) {
            element.setAttribute(ENSO_ROOT, "");
        },

        /**
         * Gets the first child element tagged as a root
         * @param {HTMLElement/DocumentFragment} root 
         * @returns 
         */
        getRoot(root) {
            return root.querySelector(`[${ENSO_ROOT}]:not([${ENSO_ROOT}="COMPONENT"])`);
        },

        /**
         * Returns whether the nodes beneath root have been parsed already.
         * @param {HTMLElement} element - Element
         * @returns {Boolean} 
         */
        isParsed(element) {
            return element.hasAttribute(ENSO_PARSED);
        },

        /**
         * Returns all children elements tagged as watched from given root
         * @param {HTMLElement/DocumentFragment} root - Root element
         */
        getWatched(root) {
            return root.querySelector(`[${ENSO_NODE}]`);
        },

        /**
         * Preprocesses the given node and/or attribute
         * @param {Object} def      - Node mutation definition
         * @param {Node} node       - The current template node
         * @returns {Boolean} - True if node was processed, otherwise false
         */
        preprocess(def, node) {
            let parsed = false;
            const opParser = this.getOperatorParser(node);
            if (opParser) {
                parsed = opParser.preprocess(def, node);
            }

            for (const parser of nodeParsers) {
                if (parser.match(node)) {
                    parsed = parser.preprocess(def, node) || parsed;
                }
            }

            if (node.attributes?.length) {
                const attributes = [...node.attributes];
                for (const attribute of attributes) {
                    const parser = this.getMutatorParser(node, attribute);
                    if (parser) {
                        parsed = parser.preprocess(def, node, attribute) || parsed;
                    }
                }
            }
            return parsed;
        },

        /**
         * Processes a HTML element attached to a component instance based
         * on a mutation definition.
         * @param {Object} def          - Node mutation definition
         * @param {Enso} parent         - Host component or fragment instance
         * @param {HTMLElement} element - Current mutated element
         */
        process(def, parent, element) {
            // Apply operator parser first
            const operator = def.getOperator();
            if (operator) {
                operator.parser.process(operator.data, parent, element);
            }
            // Loop through all the mutators attached to this node
            for (const [parser, data] of def.mutators()) {
                // Process the live node and attach any mutation effects
                parser.process(data, parent, element);
            }
            element.removeAttribute(ENSO_NODE);
        }
    });
})();

