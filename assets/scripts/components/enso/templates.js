/**
 * Templating
 */

const createFragment = html => 
    document.createRange().createContextualFragment(html);

const getChildIndex = (parent, node) => 
    Array.prototype.indexOf.call(parent.childNodes, node);

const NODE_TYPES = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT;
const getWalker = rootNode => 
    document.createTreeWalker(rootNode, NODE_TYPES, {
        acceptNode: node => node.nodeValue?.trim() !== "" ? 
            NodeFilter.FILTER_ACCEPT :
            NodeFilter.FILTER_REJECT
    });

const ENSO_ATTR = 'data-enso-idx';

export default class EnsoTemplate {
    #template = null;   // The underlying HTML template
    #nodes = [];        // List of nodes that are referenced or mutated

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
        const rootNode = template.content.firstElementChild;
        const walker = getWalker(rootNode);

        for (let node = walker.currentNode; node; node = walker.nextNode()) {
            const nodeDef = { 
                watched: false,
                index: this.#nodes.length,
                ref: null,
                events: []
            };
            if (node.attributes) {
                const attributes = Array.from(node.attributes);
                for (const attr of attributes) {
                    const type = attr.name[0];
                    const name = attr.name.slice(1).toLowerCase();
                    const value = attr.value;

                    if (type === '#') {
                        nodeDef.watched = true;
                        nodeDef[name] = value;
                        node.removeAttribute(attr.name);
                    }
                    if (type === '@') {
                        nodeDef.watched = true;
                        nodeDef.events.push({name,value});
                        node.removeAttribute(attr.name);
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
        // const refs = {};

        const elements = DOM.querySelectorAll(`[${ENSO_ATTR}]`);
        const nodes = [];

        for (const element of elements) {
            const idx = parseInt(element.getAttribute(ENSO_ATTR));
            const {ref, events} = this.#nodes[idx];
            element.removeAttribute(ENSO_ATTR);
            nodes.push({ element, ref, events });
        }

        return { nodes, DOM };
    }
;}