
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { uuid } from "../utils/uuid.js";
import { ENSO_NODE, ENSO_ROOT } from "../core/symbols.js";


const targetNode = node => (
    (node.nodeType === Node.TEXT_NODE) ?
        node.parentElement : node
);

export class NodeDef {
    #id;
    #map;
    #node;

    #mutators = new Map();
    #operator = null;
    
    constructor(id, node, map) {
        this.#id = id;
        this.#map = map;
        this.#node = node;
    }

    get id() { return this.#id; }
    get node() { return this.#node; }
    get map() { return this.#map; }

    setOperator(parser, data) { 
        this.#operator = { parser, data };
    }
    getOperator() { return this.#operator; }

    addMutator(parser, data) {
        if (!this.#mutators.has(parser)) {
            this.#mutators.set(parser, []);
        }
        this.#mutators.get(parser).push(data);
        this.markWatched();
    }
    /* v8 ignore start */       // There's no real logic here to cover differently
    getMutators(parser) {
        /* v8 ignore next */
        return this.#mutators.get(parser) || [];
    }
    /* v8 ignore stop */
    mutators() {
        return this.#mutators.entries();
    }

    // Node manipulation
    markRoot(tag = false) {
        this.#node?.setAttribute(ENSO_ROOT, tag ? this.#id : "");
    }
    unRoot() {
        this.#node?.removeAttribute(ENSO_ROOT);
    }
    isRoot() {
        return this.#node?.hasAttribute(ENSO_ROOT);
    }

    markWatched(append = true) {
        const el = targetNode(this.#node);
        if (!el.hasAttribute(ENSO_NODE)) {
            el.setAttribute(ENSO_NODE, this.#id);
        }
        if (append) this.#map.add(this);
    }
    unWatch() {
        const el = targetNode(this.#node);
        el?.removeAttribute(ENSO_NODE);
    }
    isWatched() {
        return this.#node?.hasAttribute(ENSO_NODE);
    }

    replaceNode(node) {
        const original = this.#node;
        this.#node.replaceWith(node);
        this.#node = node;
        this.markWatched(false);
        return original;
    }
}

export class NodeDefMap {
    #map = new Map();

    get size() { return this.#map.size; }

    add(nodeDef) {
        if (!this.#map.has(nodeDef.id)) {
            this.#map.set(nodeDef.id, nodeDef);
        }
    }

    get(id) {
        if (this.#map.has(id)) return this.#map.get(id);
        return null;
    }
    getByNode(node) {
        if (!node?.hasAttribute(ENSO_NODE)) return null;
        const id = node.getAttribute(ENSO_NODE);
        return this.#map.get(id);
    }
    getByRoot(node) {
        if (!node?.hasAttribute(ENSO_ROOT)) return null;
        const id = node.getAttribute(ENSO_ROOT);
        return this.#map.get(id);
    }

    create(node) {
        const el = targetNode(node);
        const index = el.getAttribute(ENSO_NODE);
        return (this.#map.has(index) ?
            this.#map.get(index) : // Node is already watched, so return it's existing def
            new NodeDef( uuid(), node, this )
        );
    }

    createRoot(node) {
        const def = new NodeDef( uuid(), node, this );
        def.markRoot(true);
        this.add(def);
        return def;
    }

    [Symbol.iterator]() {
        return this.#map.values();
    }
}
