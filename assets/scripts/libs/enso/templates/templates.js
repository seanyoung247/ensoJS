
import { createTemplate } from "../utils/dom.js";
import { parser, createNodeDef } from "./parser.js";
import './parsers/parsers.js';

// If node is a text node with handle bars ({{}}) or an element, parse it
const nodeEx = /({{(.|\n)*}})/;
const acceptNode = node => 
    node.nodeType != Node.TEXT_NODE || nodeEx.test(node.nodeValue) ?
        NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;

const NODE_TYPES = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT;

const getWalker = rootNode => 
    document.createTreeWalker(rootNode, NODE_TYPES, { acceptNode });


export default class EnsoTemplate {
    #template = null;       // The underlying HTML template
    #watched = [];          // List of nodes that are referenced or mutated

    constructor(html) {
        const template = (typeof html === 'string') ?
            createTemplate(html) : html;

        this.#template = this.#parse(template);
    }

    #parse(template) {
        const rootNode = template.content;
        const walker = getWalker(rootNode);

        // First node is a document fragment, which we don't care about.
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            let watched = false;
            const def = createNodeDef(this.#watched, node);

            switch (node.nodeType) {
                case Node.TEXT_NODE:
                    watched = parser.preprocess(def, node) || watched;
                    break;
                
                case Node.ELEMENT_NODE:
                    if (node.attributes) {
                        const attributes = [...node.attributes];
                        for (const attr of attributes) {
                            watched = parser.preprocess(def, node, attr) || watched;
                        }
                    }
                    break;
            }

            if (watched) {
                parser.setNodeIndex(node, def.index);
                this.#watched.push(def);
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