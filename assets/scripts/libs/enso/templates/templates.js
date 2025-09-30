
import { createTemplate } from "../utils/dom.js";
import { parser, createNodeDef } from "./parser.js";
import './parsers/parsers.js';

// If node is a text node with handle bars ({{}}) or an element, parse it
const nodeEx = /({{(.|\n)*}})/;
const acceptNode = node => 
    // If a node is a text node, it must contain template directives {{}} to be accepted
    node.nodeType != Node.TEXT_NODE || nodeEx.test(node.nodeValue) ?
        NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;

const NODE_TYPES = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT;

const getWalker = rootNode => 
    document.createTreeWalker(rootNode, NODE_TYPES, { acceptNode });


export default class EnsoTemplate {
    #template = null;       // The underlying HTML template
    #watched = [];          // List of nodes that are referenced or mutated

    constructor(html) {
        const template = createTemplate(html);

        this.#template = this.#parse(template);
    }

    #parse(template) {
        const rootNode = template.content;
        const walker = getWalker(rootNode);
        
        let node;
        const nodes = [];
        while ((node = walker.nextNode())) nodes.push(node);

        for (const node of nodes) {
            const def = createNodeDef(this.#watched, node);
            const watched = parser.preprocess(def, node);

            if (watched) {
                parser.addWatchedNode(def.node, def, this.#watched);
            }
        }

        Object.freeze(this.#watched);
        return template;
    }

    get watchedNodes() { return this.#watched; }

    clone() {
        return this.#template.content.cloneNode(true);
    }
}
