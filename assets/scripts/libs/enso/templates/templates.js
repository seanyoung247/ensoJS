
import { createTemplate } from "../utils/dom.js";
import { parser, createNodeDef } from "./parser.js";
import './parsers/parsers.js';


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

        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            let watched = false;
            const def = createNodeDef(this.#watched, node);

            if (node.nodeType === Node.TEXT_NODE) {

                watched = parser.preprocess(def, node) || watched;
        
            } else if (node.nodeType === Node.ELEMENT_NODE) {

                if (node.attributes) {
                    const attributes = [...node.attributes];
                    for (const attr of attributes) {
                        watched = parser.preprocess(def, node, attr) || watched;
                    }
                }

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