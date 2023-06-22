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


function createFunction(code) {
    const func = new Function(`return ${code}`);
    return func();
}

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
            const attributes = node.attributes;
            const nodeDef = { 
                watched: false,
                index: this.#nodes.length,
                ref: null,
                events: []
            };
            if (attributes) {
                for (const attr of attributes) {
                    const type = attr.name[0];
                    const name = attr.name.slice(1).toLowerCase();
                    const value = attr.value;

                    if (type === '#') {
                        nodeDef.watched = true;
                        nodeDef[name] = value;
                    }
                    if (type === '@') {
                        nodeDef.watched = true;
                        nodeDef.events.push({name,value});
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
        const refs = {};

        const elements = DOM.querySelectorAll(`[${ENSO_ATTR}]`);
        for (const el of elements) {
            const idx = parseInt(el.getAttribute(ENSO_ATTR));
            
            const node = this.#nodes[idx];

            if (node.ref) {
                refs[node.ref] = el;
            }
            if (node.events.length) {
                for (const event of node.events) {
                    const handler = createFunction(event.value);
                    el.addEventListener(event.name, handler);
                }
            }
            el.removeAttribute(ENSO_ATTR);
        }

        return {refs, DOM};
    }
;}