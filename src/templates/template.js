/* eslint-disable no-cond-assign */

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { createTemplate } from "../utils/dom.js";
import { NodeDefMap } from "./nodedef.js";
import { parser } from "./parser.js";
import { createPlaceholder } from "./parsers/utils.js";
import { ENSO_PARSED, ENSO_FRAGMENT, ENSO_ROOT } from "../core/symbols.js";

import './parsers/parsers.js';


// If node is a text node with handle bars ({{}}) or an element, parse it
const nodeEx = /{{[^]*}}/;

// No parse tags
const noParseTags = new Set(['SCRIPT']);
const isNoParseTag = node => (
    node.nodeType === Node.ELEMENT_NODE &&
    noParseTags.has(node.tagName)
);
// Explicit ignore attribute
const isIgnoreNode = node => (
    node.nodeType === Node.ELEMENT_NODE &&
    node.hasAttribute('enso:ignore')
);
// Explicit ignore children attribute
const isIgnoredChild = node => (
    node.parentNode?.hasAttribute('enso:ignore-children')
);
// Tree walker filter
const acceptNode = node => {
    // Ignore explicit no parse directives
    if (isIgnoreNode(node)) {
        return NodeFilter.FILTER_REJECT;
    }
    // Ignore children if specified
    if (isIgnoredChild(node)) {
        return NodeFilter.FILTER_REJECT;
    }
    // Ignore no parse tags
    if (isNoParseTag(node)) {
        return NodeFilter.FILTER_REJECT;
    }
    // Accept all other element nodes
    if (node.nodeType === Node.ELEMENT_NODE) {
        return NodeFilter.FILTER_ACCEPT;
    }
    // Accept text nodes with template directives
    if (node.nodeType === Node.TEXT_NODE && 
        nodeEx.test(node.nodeValue)) {
        return NodeFilter.FILTER_ACCEPT;
    }
    // Reject all other nodes
    return NodeFilter.FILTER_REJECT;
};

const NODE_TYPES = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT;

const getWalker = rootNode => 
    document.createTreeWalker(rootNode, NODE_TYPES, { acceptNode });


const extractLooseFragments = root => {
    const loose = root.querySelectorAll(
        `${ENSO_FRAGMENT}:not([${ENSO_ROOT}])`
    );

    for (const node of loose) {
        const children = [...node.childNodes];
        if (children.length === 0) {
            node.remove();
            continue;
        }

        node.replaceWith(...children);
    }
};

const wrapFragment = (root) => {
    const frag = document.createElement(ENSO_FRAGMENT);
    frag.append(root);
    return frag;
};


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

        const rootNode = wrapFragment(template.content);
        rootNode.setAttribute(ENSO_ROOT, "COMPONENT");
        template.content.append(rootNode);
        const walker = getWalker(rootNode);
        
        let node;
        while (node = walker.nextNode()) {
            const def = this.#watched.create(node);
            parser.preprocess(def, node);
        }
        // parser.markRoot(template);
        template.setAttribute(ENSO_PARSED, "");

        this.#watched;
        return template;
    }

    #fragment() {
        const rootNode = this.#template.content;
        // Ensure there's no orphand enso-fragments
        extractLooseFragments(rootNode);
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
            //     wrapFragment(root, wrap)
            // );
            template.setAttribute(ENSO_PARSED, "");
            def.directive.template = new EnsoTemplate(template, this.#watched, true);
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

    clone() {
        // const template = cloneTemplate(this.#template);
        const template = this.#template.cloneNode(true);
        return new EnsoTemplate(template, this.#watched);
    }

    get watchedNodes() { return this.#watched; }
    get template() { return this.#template; }
}
