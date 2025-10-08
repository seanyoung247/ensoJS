
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { createTemplate } from "../utils/dom.js";
import { parser, NodeDefMap } from "./parser.js";
import { ATTACH_TEMPLATE } from '../core/symbols.js';
import { createPlaceholder } from "./parsers/utils.js";
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
    #template = null;   // The underlying HTML template
    #watched;           // The nodes that are referenced or mutated

    constructor(html, watched = new NodeDefMap()) {
        const template = createTemplate(html);
        this.#watched = watched;

        this.#template = this.#parse(template);
        // this.#fragment();
    }

    #parse(template) {
        if (parser.isParsed(template)) return template;

        const rootNode = template.content;
        const walker = getWalker(rootNode);
        
        let node;
        while (node = walker.nextNode()) {
            // const def = createNodeDef(this.#watched, node, this);
            const def = this.#watched.create(node);
            const watched = parser.preprocess(def, node);

            // if (watched) {
            //     parser.addWatchedNode(def.node, def, this.#watched);
            // }
        }
        parser.markRoot(template);

        this.#watched;
        return template;
    }

    #fragment() {
        const rootNode = this.#template.content;
        // Iterate over sub roots, pull them out and place them 
        // into new templates and attach to placeholder nodes.
        const roots = parser.getRoots(rootNode);
        for (const root of roots) {

            // Get node watch parameters and replace with placeholder
            const id = parser.getNodeIndex(root);
            const def = this.#watched.get(id);
            const placeholder = createPlaceholder();

            root.replaceWith();

            // Construct and append the template.
            const template = createTemplate(root);
            parser.markRoot(template);

            def.directive.template = new EnsoTemplate(template);
        }
    }

    process(parent) {
        // Parse and attach template
        const DOM = this.#template.content.cloneNode(true);
        // Loop through the elements and process any watched nodes
        let element;
        while (element = parser.getWatched(DOM)) {
            parser.process(
                this.#watched.getByNode(element), 
                parent, element
            );
        }
    
        parent[ATTACH_TEMPLATE](DOM);
    }

    get watchedNodes() { return this.#watched; }
}
