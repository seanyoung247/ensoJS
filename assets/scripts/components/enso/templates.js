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


const bindEx = RegExp(/(?:this\.)(\w+|\d*)/gi);

export const ENSO_ATTR = 'data-enso-idx';
export const ENSO_BIND = 'data-enso-bind';

export default class EnsoTemplate {
    #template = null;       // The underlying HTML template
    #watched = [];            // List of nodes that are referenced or mutated

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
                index: this.#watched.length,
                ref: null,      // Name to use for element reference or null (no reference)
                events: [],     // List of event handlers
                attrs: [],      // List of bound attributes
                content: null   // Content mutation
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

                // Collect data bindings
                bindEx.lastIndex = 0;
                let bind;
                const bindings = [];
                while (bind = bindEx.exec(nodeDef.content)) {
                    if (!bindings.includes(bind[1])) bindings.push(bind[1]);
                }
                node.setAttribute(ENSO_BIND, bindings.join(' '));
            }

            if (node.attributes) {
                // Parse Attributes
                const attributes = Array.from(node.attributes);
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

    get watched() { return this.#watched; }

    clone() {
        return this.#template.content.cloneNode(true);
    }
}