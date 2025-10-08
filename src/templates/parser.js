/**
 * @module parser - Template parser and processor
 */

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { uuid } from "../utils/uuid.js";

// Watched node definition index
const ENSO_NODE = 'data-enso-node';
const ENSO_ROOT = 'data-enso-root';

const targetNode = node => (
    (node.nodeType === Node.TEXT_NODE) ?
        node.parentElement : node
);

export class NodeDef {
    #id;
    #map;
    #node;
    // Watched node properties
    #ref;               // Name to use for element reference or null (no reference)
    #events = [];       // List of event handlers
    #attrs = [];        // Attribute mutations
    #content = [];      // Content mutations
    #directive;         // Node mutation
    #parsers = new Set; // List of required parsers
    
    constructor(id, node, map) {
        this.#id = id;
        this.#map = map;
        this.#node = node;
    }

    get id() { return this.#id; }
    set node(val) { this.#node = val; }
    get node() { return this.#node; }

    // References
    get ref() { return this.#ref; }
    set ref(val) { 
        this.#ref = val; 
        this.markWatched();
    }

    // Events
    addEvent(name, func) {
        this.#events.push({ name, func });
        this.markWatched();
    }
    get events() { return this.#events; }

    // Attributes
    addAttribute(name, effect, binds) {
        this.#attrs.push({ name, effect, binds });
        this.markWatched();
    }
    get attributes() { return this.#attrs; }

    // Content
    addContent(parent, index, effect, binds) {
        this.#content.push({ parent, index, effect, binds });
        this.markWatched();
    }
    get content() { return this.#content; }

    // Directive
    setDirective(type, template, effect, binds) {
        this.#directive = { type, template, effect, binds };
        this.markWatched();
    }
    get directive() { return this.#directive; }

    // Parsers
    attachParser(parser) {
        this.#parsers.add(parser);
    }

    get parsers() {
        return this.#parsers;
    }

    // Node manipulation
    markRoot() {
        this.#node.setAttribute(ENSO_ROOT, "");
    }
    markWatched() {
        const el = targetNode(this.#node);

        el.setAttribute(ENSO_NODE, this.#id);
        this.#map.add(this);
    }
}

export class NodeDefMap {
    #map = new Map();

    add(nodeDef) {
        if (!this.#map.has(nodeDef.id)) {
            this.#map.set(nodeDef.id, nodeDef);
        }
    }

    get(id) {
        if (this.#map.has(id)) return this.#map.get(id);
        return null;
    }
    getByNode(node) {
        if (!node?.hasAttribute(ENSO_NODE)) return null;
        const id = node.getAttribute(ENSO_NODE);
        return this.#map.get(id);
    }

    create(node) {
        const el = targetNode(node);
        const index = el.getAttribute(ENSO_NODE);

        return (this.#map.has(index) ?
            this.#map.get(index) : // Node is already watched, so return it's existing def
            new NodeDef( uuid(), node, this )
        );
    }

    [Symbol.iterator]() {
        return this.#map.values();
    }
}

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
         * 
         * @param {HTMLElement/DocumentFragment} root 
         * @returns 
         */
        getRoots(root) {
            return root.querySelectorAll(`[${ENSO_ROOT}]`);
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
                def.attachParser(nodeParser);
                return nodeParser.preprocess(def, node);
            }

            const attributes = [...node.attributes];
            for (const attribute of attributes) {
                const parser = this.getAttrParser(node, attribute);
                if (parser) {
                    def.attachParser(parser);
                    parser.preprocess(def, node, attribute);
                }
            }
            return (def.parsers.length > 0);
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
