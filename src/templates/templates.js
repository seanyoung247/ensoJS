/* eslint-disable no-cond-assign */

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { createTemplate } from "../utils/dom.js";
import { NodeDefMap } from "./nodedef.js";
import { parser } from "./parser.js";
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
        this.#fragment();
    }

    #parse(template) {
        if (parser.isParsed(template)) return template;

        const rootNode = template.content;
        const walker = getWalker(rootNode);
        
        let node;
        while (node = walker.nextNode()) {
            const def = this.#watched.create(node);
            parser.preprocess(def, node);
        }
        // parser.markRoot(template);
        template.setAttribute("enso-fragment", "");

        this.#watched;
        return template;
    }

    #fragment() {
        const rootNode = this.#template.content;
        // Iterate over sub roots, pull them out and place them 
        // into new templates and attach to placeholder nodes.
        let root;
        while (root = parser.getRoot(rootNode)) {

            // Get node watch parameters and replace with placeholder
            const def = this.#watched.getByRoot(root);
            def.unRoot();
            def.replaceNode( createPlaceholder() );

            // Construct and append the template.
            const template = createTemplate(root);
            template.setAttribute("enso-fragment", "");

            def.directive.template = new EnsoTemplate(template, this.#watched);
        }
    }

    process(parent) {
        // Parse and attach template
        const DOM = this.#template.content.cloneNode(true);
        // Loop through the elements and process any watched nodes
        let element;
        while (element = parser.getWatched(DOM)) {
            const def = this.#watched.getByNode(element);
            parser.process( def, parent, element );
        }
        return DOM;
    }

    get watchedNodes() { return this.#watched; }
}
