/**
 * Templating
 */
import { createTemplate } from "../utils/dom.js";

// DOM Traversal
const acceptNode = node => 
    node.nodeType != Node.TEXT_NODE || node.nodeValue.includes('{{') ?
        NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;

const NODE_TYPES = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT;
const getWalker = rootNode => 
    document.createTreeWalker(rootNode, NODE_TYPES, { acceptNode });


const bindEx = RegExp(/(?:this\.)(\w+|\d*)/gi);

export const ENSO_ATTR = 'data-enso-node';  // Index of the node in the node definitions

export default class EnsoTemplate {
    #template = null;       // The underlying HTML template
    #watched = [];          // List of nodes that are referenced or mutated
    #bindings = new Set();  // Set of bound component properties

    constructor(html) {
        const template = (typeof html === 'string') ?
            createTemplate(html) : html;

        this.#template = this.#parse(template);
    }

    #parse(template) {
        const rootNode = template.content;
        const walker = getWalker(rootNode);

        for (let node = walker.currentNode; node; node = walker.nextNode()) {
            let watched = false;
            const nodeDef = {
                index: this.#watched.length, // Index in the node list
                ref: null,          // Name to use for element reference or null (no reference)
                binds: new Set(),   // List of bound component properties
                events: [],         // List of event handlers
                attrs: [],          // List of mutated attributes
                content: null       // Content mutation
            };

            // Parse text nodes
            if (node.nodeType === Node.TEXT_NODE) {
                const span = document.createElement('span');

                watched = true;
                nodeDef.content = '`' + node.nodeValue
                    .replaceAll('{{', '${')
                    .replaceAll('}}', '}')
                    .trim() + '`';

                node.parentNode.replaceChild(span, node);
                node = walker.currentNode = span;

                // Collect content data bindings
                let bind;
                while (bind = bindEx.exec(nodeDef.content)) {
                    nodeDef.binds.add(bind[1]);
                    this.#bindings.add(bind[1]);
                }
            }

            if (node.attributes) {
                const attributes = [...node.attributes];
                for (const attr of attributes) {
                    const id = attr.name[0];
                    const name = attr.name.slice(1).toLowerCase();
                    const value = attr.value;

                    if (id === '#') { // Reference
                        watched = true;
                        nodeDef[name] = value;
                        node.removeAttribute(attr.name);
                    }
                    if (id === '@') { // Event
                        watched = true;
                        nodeDef.events.push({name,value});
                        node.removeAttribute(attr.name);
                    }
                }
            }
            if (watched) {
                node.setAttribute(ENSO_ATTR, nodeDef.index);
                this.#watched.push(nodeDef);
            }
        }

        Object.freeze(this.#watched);
        return template;
    }

    get watchedNodes() { return this.#watched; }
    get boundValues() { return this.#bindings; }

    clone() {
        return this.#template.content.cloneNode(true);
    }
}