/**
 * @module parser - Template parser and processor
 */

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { ENSO_NODE, ENSO_ROOT } from "../core/symbols.js";

export const parser = (() => {
    const nodeParsers = [];
    const attrParsers = [];

    return Object.freeze({
        /**
         * Register a new template directive parser
         * @param {Object} parser   - Directive parser code implementation
         */
        registerNode(parser) {
            nodeParsers.push(parser);
        },
        /**
         * Register a new template attribute parser
         * @param {Object} parser   - Attribute parser code implementation
         */
        registerAttr(parser) {
            attrParsers.push(parser);
        },

        /**
         * Find a directive for this node
         * @param {Node} node       - The node to parse
         * @returns {Object}        - The directive requested
         */
        getNodeParser(node) {
            for (const nodeParser of nodeParsers) {
                if (nodeParser.match(node)) return nodeParser;
            }
            return null;
        },

        /**
         * Returns a Parser identified by the id
         * @param {Node} node       - The node to parse
         * @param {Attr} attribute  - The Attribute node to parse     
         * @returns {Object}        - The parser requested
         */
        getAttrParser(node, attribute) {
            for (const parser of attrParsers) {
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
            return root.querySelector(`[${ENSO_ROOT}]`);
        },

        /**
         * Returns whether the nodes beneath root have been parsed already.
         * @param {HTMLElement} element - Element
         * @returns {Boolean} 
         */
        isParsed(element) {
            return element.hasAttribute(ENSO_ROOT);
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
            const nodeParser = this.getNodeParser(node);
            if (nodeParser) {
                return nodeParser.preprocess(def, node);
            }

            if (node.attributes) {
                const attributes = [...node.attributes];
                for (const attribute of attributes) {
                    const parser = this.getAttrParser(node, attribute);
                    if (parser) {
                        parser.preprocess(def, node, attribute);
                    }
                }
            }
            return (def.parsers.size > 0);
        },

        /**
         * Processes a HTML element attached to a component instance based
         * on a mutation definition.
         * @param {Object} def          - Node mutation definition
         * @param {Enso} parent         - Host component or fragment instance
         * @param {HTMLElement} element - Current mutated element
         */
        process(def, parent, element) {
            // Loop through all the parsers attached to this node
            for (const parser of def.parsers) {
                // Process the live node and attach any mutation effects
                parser.process(def, parent, element);
            }
            element.removeAttribute(ENSO_NODE);
        }
    });
})();

