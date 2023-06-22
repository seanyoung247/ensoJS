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
            const attributes = node.attributes;
            const nodeDef = { 
                watched: false,
                index: this.#nodes.length + 1,
                ref: null,

            };
            if (attributes) {
                for (const attr of attributes) {
                    const type = attr.name[0];
                    const name = attr.name.slice(1).toLowerCase();
                    const value = attr.value;
                    if (type === '#') {
                        nodeDef.watched = true;
                        nodeDef[name] = value;
                        node.removeAttribute(attr.name);
                    }
                }
            }
            if (nodeDef.watched) {
                node.setAttribute('data-enso-id', nodeDef.index);
                this.#nodes.push(nodeDef);
            }
        }

        return template;
    }

    clone() {
        const DOM = this.#template.content.cloneNode(true);
        const refs = {};

        // Compile watched nodes
        for (const node of this.#nodes) {
            const el = DOM.querySelector(`[data-enso-id="${node.index}"]`);
            if (node.ref) {
                refs[node.ref] = el;
            }
            el.removeAttribute('data-enso-id');
        }

        return {refs, DOM};
    }
;}