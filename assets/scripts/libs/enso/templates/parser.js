
// import './parsers/parsers.js';

const noParser = {
    preprocess() { return false; },
    process() { return false; }
};

const ENSO_NODE = 'data-enso-node';  // Watched node identifier and definition index

/**
 * Creates a new mutation definition for a node
 * @param {Number} index - The next available index in the mutation list
 * @returns {Object} - Mutation definition
 */
export const createNodeDef = index => ({
    index,          // Index in the node list
    ref: null,      // Name to use for element reference or null (no reference)
    events: null,   // List of event handlers
    attrs: null,    // Attribute mutations
    content: null,  // Content mutations
    parsers: [],    // List of required parsers
});

export const parser = (() => {
    const parsers = new Map();

    return Object.freeze({
        /**
         * Register a new template parser
         * @param {String} id       - String identfier for the parser
         * @param {Object} parser   - Parser code implementation
         */
        register(id, parser) {
            parsers.set(id, parser);
        },

        /**
         * Returns a Parser identified by the id
         * @param {String} id       - String identifier for the parser
         * @returns {Object}        - The parser requested
         */
        getParser(id) {
            return (parsers.get(id) ?? noParser);
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
         * definition index.
         * @param {HTMLElement} element - Watched element
         * @param {Number} index        - Node definition index
         */
        setNodeIndex(node, index) {
            node.setAttribute(ENSO_NODE, index);
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
            const id = attribute ? attribute.name[0] : 'TEXT';
            const parser = this.getParser(id);
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


// Property binding (.<property name>) parser
// Command directive (*<command>) parser