/**
 * @module parser - Template parser and processor
 */

// Watched node identifier and definition index
const ENSO_NODE = 'data-enso-node';

/**
 * Creates a new mutation definition for a node
 * @param {Object[]} defs - The node mutation definition list
 * @param {Node} node - HTML node 
 * @returns {Object} - Mutation definition
 */
export const createNodeDef = (defs, node) => {
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const index = parseInt(el.getAttribute(ENSO_NODE));
    
    return (index >= 0) ? 
        defs[index] :   // Node is already watched, so return it's existing def
        {
            index: defs.length,
            ref: null,          // Name to use for element reference or null (no reference)
            events: null,       // List of event handlers
            attrs: null,        // Attribute mutations
            content: null,      // Content mutations
            directive: null,    // Node mutation
            parsers: [],        // List of required parsers
        };
};

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
         * Attaches the given parser to the node definition
         * @param {Object} parser   - Parser to attach
         * @param {Object} def      - Node definition
         */
        attachParser(parser, def) { 
            if (!def.parsers.includes(parser)) {
                def.parsers.push(parser); 
            }
        },

        /**
         * Returns the node definition index for the given
         * mutated element.
         * @param {HTMLElement} element - Watched element
         * @returns {Number}            - The index of the elements node definition
         */
        getNodeIndex(element) {
            return parseInt(element.getAttribute(ENSO_NODE));
        },

        /**
         * Tags the element as watched and stores it's node 
         * definition.
         * @param {HTMLElement} element - Watched element
         * @param {Object} def          - Node definition object
         * @param {Object[]} watched    - Array of watched node definition
         */
        addWatchedNode(node, def, watched) {
            // Do we need to attach to the node itself or it's parent?
            const el = (node.nodeType === Node.TEXT_NODE) ? 
                node.parentElement : node;
            // Tag the element as watched
            el.setAttribute(ENSO_NODE, def.index);
            if (def.index >= watched.length) {
                watched.push(def);
            }
        },

        /**
         * Returns all children elements tagged as watched from given root
         * @param {HTMLElement} root - Root element
         */
        getElements(root) {
            return root.querySelectorAll(`[${ENSO_NODE}]`);
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
                this.attachParser(nodeParser, def);
                return nodeParser.preprocess(def, node);
            }

            const attributes = [...node.attributes];
            for (const attribute of attributes) {
                const parser = this.getAttrParser(node, attribute);
                if (parser) {
                    this.attachParser(parser, def);
                    parser.preprocess(def, node, attribute);
                }
            }
            return (def.parsers.length > 0);
        },

        /**
         * Processes a HTML element attached to a component instance based
         * on a mutation definition.
         * @param {Object} def          - Node mutation definition
         * @param {Enso} component      - Host component instance
         * @param {HTMLElement} element - Current mutated element
         */
        process(def, component, element) {
            // Loop through all the parsers attached to this node
            for (const parser of def.parsers) {
                console.log(parser.type);
                // Process the live node and attach any mutation effects
                parser.process(def, component, element);
            }
            element.removeAttribute(ENSO_NODE);
        }
    });
})();
