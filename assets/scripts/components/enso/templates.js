/**
 * Templating
 */
import { createTemplate, createWalker } from "./dom.js";

// DOM Traversal
const acceptNode = node => 
    node.nodeType != Node.TEXT_NODE || node.nodeValue.includes('{{') ?
        NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
const NODE_TYPES = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT;
const getWalker = rootNode => createWalker(rootNode, NODE_TYPES, acceptNode);


const ENSO_ATTR = 'data-enso-idx';
export default class EnsoTemplate {
    #template = null;       // The underlying HTML template
    #bindings = new Map();  // List of bound values found in the 
    #nodes = [];            // List of nodes that are referenced or mutated

    constructor(html) {
        const template = (typeof html === 'string') ?
            createTemplate(html) : html;

        this.#template = this.#parse(template);
    }

    #parse(template) {
        const rootNode = template.content;
        const walker = getWalker(rootNode);

        for (let node = walker.currentNode; node; node = walker.nextNode()) {
            const nodeDef = { 
                watched: false,
                index: this.#nodes.length,
                ref: null,      // Name to use for element reference or null (no reference)
                events: [],     // List of event handlers
                attrs: [],      // List of bound attributes
                content: null   // Content mutation
            };

            // Parse text nodes
            if (node.nodeType === Node.TEXT_NODE) {
                const span = document.createElement('span');

                nodeDef.watched = true;
                nodeDef.content = '`' + node.nodeValue
                    .replaceAll('{{', '${')
                    .replaceAll('}}', '}')
                    .trim() + '`';

                node.parentNode.replaceChild(span, node);
                node = walker.currentNode = span;

                // Collect data bindings
            }

            if (node.attributes) {
                // Parse Attributes
                const attributes = Array.from(node.attributes);
                for (const attr of attributes) {
                    const id = attr.name[0];
                    const name = attr.name.slice(1).toLowerCase();
                    const value = attr.value;

                    if (id === '#') { // Reference
                        nodeDef.watched = true;
                        nodeDef[name] = value;
                        node.removeAttribute(attr.name);
                    }
                    if (id === '@') { // Event
                        nodeDef.watched = true;
                        nodeDef.events.push({name,value});
                        node.removeAttribute(attr.name);
                    }
                    if (id === ':') { // Binding
                        nodeDef.watched = true;
                        
                    }
                }
            }
            if (nodeDef.watched) {
                node.setAttribute(ENSO_ATTR, nodeDef.index);
                this.#nodes.push(nodeDef);
            }
        }

        return template;
    }

    clone() {
        const DOM = this.#template.content.cloneNode(true);
        const elements = DOM.querySelectorAll(`[${ENSO_ATTR}]`);
        const watched = [];

        for (const element of elements) {
            const idx = parseInt(element.getAttribute(ENSO_ATTR));
            const {ref, events, attrs, content} = this.#nodes[idx];
            element.removeAttribute(ENSO_ATTR);
            watched.push({ element, ref, events, attrs, content });
        }

        return { watched, DOM };
    }
}