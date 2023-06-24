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
        console.log('creating template');
        const template = document.createElement('template');
        console.log('appending template');
        template.content.appendChild(createFragment(html));
        console.log('parsing template');
        this.#template = this.#parse(template);
        console.log('parsing complete');
    }

    #parse(template) {
        const rootNode = template.content;
        const walker = getWalker(rootNode);

        for (let node = walker.currentNode; node; node = walker.nextNode()) {
            const nodeDef = { 
                watched: false,
                index: this.#nodes.length,
                ref: null,
                events: []
            };
            if (node.attributes) {

                // Strip out top level HTML templates
                if (node.parentNode === rootNode && node?.tagName === 'TEMPLATE') {
                    const parent = node.parentNode;
                    const content = node.content;
                    parent.replaceChild(content, node);
                    walker.currentNode = content;
                }

                const attributes = Array.from(node.attributes);
                for (const attr of attributes) {
                    const type = attr.name[0];
                    const name = attr.name.slice(1).toLowerCase();
                    const value = attr.value;

                    if (type === '#') { // Reference
                        nodeDef.watched = true;
                        nodeDef[name] = value;
                        node.removeAttribute(attr.name);
                    }
                    if (type === '@') { // Event
                        nodeDef.watched = true;
                        nodeDef.events.push({name,value});
                        node.removeAttribute(attr.name);
                    }
                    if (type === '*') { // Binding

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
        console.log('cloning template');
        const DOM = this.#template.content.cloneNode(true);
        const elements = DOM.querySelectorAll(`[${ENSO_ATTR}]`);
        const nodes = [];
        console.log('parsing new DOM')
        for (const element of elements) {
            const idx = parseInt(element.getAttribute(ENSO_ATTR));
            const {ref, events} = this.#nodes[idx];
            element.removeAttribute(ENSO_ATTR);
            nodes.push({ element, ref, events });
        }
        console.log('attaching dom to component');
        return { nodes, DOM };
    }
}