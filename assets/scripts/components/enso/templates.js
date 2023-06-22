/**
 * Templating
 */

const createFragment = html => 
    document.createRange().createContextualFragment(html);

const getChildIndex = (parent, node) => 
    Array.prototype.indexOf.call(parent.childNodes, node);


const ignoreWhiteSpace = {
    // Ignore text nodes that are just white space
    acceptNode: (node) => 
        node.nodeValue?.trim() !== "" ?
            NodeFilter.FILTER_ACCEPT : 
            NodeFilter.FILTER_REJECT
}


const NODE_TYPES = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT;
const getWalker = (rootNode, filter=null) => 
    document.createTreeWalker(rootNode, NODE_TYPES, filter);

/* Need to store:
 *  o   Referenced nodes
 *  o   Event Listeners
 *  o   Mutated nodes.
 *        Nodes that have simple mutations,
 *        Attributes or text content that changes
 *        { 
 *          parent?,
 *          childIndex?
 *          NodeTag,    - An identifier for the node
 *          attribute,  - List? of attributes that are mutated
 *          operation   - Code run on change
 *        }
 *  o   Conditionals
 *  o   ForEach
 */

export default class EnsoTemplate {
    #template = null;   // The underlying HTML template
    #nodes = [];        // List of nodes that are watched or mutated

    constructor(html) {
        let template = createFragment(html).firstElementChild;
        
        if (template.tagName != 'TEMPLATE') {
            const temp = document.createElement('template');
            temp.content.appendChild(template);
            template = temp;
        }

        this.#template = this.#parse(template);
    }

    #parse(template) {
        const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);

        // Strip templated directives out and prep them for evaluation

    }
}