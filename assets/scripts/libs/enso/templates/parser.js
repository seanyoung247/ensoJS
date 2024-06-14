
const noParser = {
    preprocess() { return false; },
    process() { return false; }
};

const ENSO_NODE = 'data-enso-node';  // Watched node identifier and definition index

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
            ref: null,       // Name to use for element reference or null (no reference)
            events: null,    // List of event handlers
            attrs: null,     // Attribute mutations
            content: null,   // Content mutations
            templates: null, // List of generated nodes
            parsers: [],     // List of required parsers
        };
};

export const parser = (() => {
    const parsers = [];

    return Object.freeze({
        /**
         * Register a new template parser
         * @param {Object} parser   - Parser code implementation
         */
        register(parser) {
            parsers.push(parser);
        },

        /**
         * Returns a Parser identified by the id
         * @param {Node} node       - The node to parse
         * @param {Attr} attribute  - The Attribute node to parse     
         * @returns {Object}        - The parser requested
         */
        getParser(node, attribute) {
            for (const parser of parsers) {
                if (parser.match(node, attribute)) return parser;
            }
            return noParser;
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
            const el = node.nodeType === Node.TEXT_NODE ? 
                node.parentElement : node;
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
         * @param {Attr} attribute  - The current attribute or none
         * @returns {Boolean} - True if node was processed, otherwise false
         */
        preprocess(def, node, attribute=null) {
            const parser = this.getParser(node, attribute);
            if (parser !== noParser) {
                def.parsers.push(parser);
                
            }
            return parser.preprocess(def, node, attribute);
        },

        /**
         * Processes a HTML element attached to a component instance based
         * on a mutation definition.
         * @param {Object} def          - Node mutation definition
         * @param {Enso} component      - Host component instance
         * @param {HTMLElement} element - Current mutated element
         */
        process(def, component, element) {
            // Loop through all the processors attached to this node
            for (const parser of def.parsers) {
                parser.process(def, component, element);
            }
            element.removeAttribute(ENSO_NODE);
        }
    });
})();
