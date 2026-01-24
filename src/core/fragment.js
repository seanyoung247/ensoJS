
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { EnsoNode } from "./components.js";
import { createEffectEnv } from "./effects.js";
import { 
    NODES, ENV, ADD_CHILD, CHILDREN, SCHEDULE_UPDATE,
    BINDINGS, UPDATE, ANCHOR, ENSO_FRAGMENT,
} from "./symbols.js";

// Fragment placeholder component
if (!customElements.get(ENSO_FRAGMENT.toLowerCase())) {
    class EnsoFragmentElement extends HTMLElement {}
    customElements.define(ENSO_FRAGMENT.toLowerCase(), EnsoFragmentElement);
}

/**
 * Enso Fragment base class
 * 
 * Represents a dynamic fragment of DOM that can be mounted and unmounted
 * based on conditions in the parent component.
 * 
 * Fragments are used to implement control flow directives such as *if and *for
 */
export class EnsoFragment extends EnsoNode() {
    #component;             // Root component
    #parent;                // Parent fragment
    #anchor;                // Comment node defining the fragments DOM position
    #nodes = null;          // Live nodes
    #root = null;           // Fragment root
    #env;                   // Effect environment

    #attached = false;      // Is the fragment currently attached to the DOM?

    constructor(parent, template, placeholder) {
        super();
        this.#component = parent.component;
        this.#parent = parent;
        this.#env = parent[ENV];

        // Remove the searchable placeholder node and replace with a comment anchor
        if (placeholder) {
            this.#anchor = document.createComment(this.tag);
            placeholder.replaceWith(this.#anchor);
        }

        // Register with parent
        parent[ADD_CHILD](this);

        // Create initial binding map
        const bindings = new Map();
        for (const [prop, bind] of this.#component[BINDINGS]) {
            bindings.set(prop, {
                changed: false, watchers: bind.watchers, effects: []
            });
        }
        this[BINDINGS] = bindings;

        this._processTemplate(template);
    }
    _processTemplate(template) {
        if (!template) return;

        this.#root = template.process(this);
    }
    _getChildren() {
        this.#nodes = Array.from(this.#root.childNodes);
    }

    //// Accessors - Public
    get tag() { return "enso:fragment"; }
    get component() { return this.#component; }
    get isAttached() { return this.#attached; }
    set isAttached(val) { this.#attached = val; }

    //// Accessors - Framework internal
    get [ANCHOR]() { return this.#anchor; }
    get [NODES]() { return this.#nodes; }
    get [ENV]() { return this.#env; }
    set [ENV](env) {
        this.#env = createEffectEnv(env, this.#parent[ENV]);
    }

    get #parentAttached() { return this.#parent.isAttached; }

    //// Fragment Lifecycle
    [SCHEDULE_UPDATE]() {
        this.#component[SCHEDULE_UPDATE]();
    }

    mount() {
        if (this.#attached || !this.#parentAttached) return;

        this._getChildren();
        this.#anchor.after(...this.#nodes);
        this.#attached = true;
        this[UPDATE]();
    }

    [UPDATE]() {
        if (!this.#attached) return;
        super[UPDATE]();
    }

    unmount() {
        if (!this.#attached) return;

        this.#root.append(...this.#nodes);
        this.#nodes = null;
        this.#attached = false;
    }

    // Parser API
    _requestUpdate() {
        this[UPDATE]();
    }

    _getNodes() {
        return this[NODES];
    }

    _setENV(env) {
        this[ENV] = env;
    }

    _insertAfterAnchor(...elements) {
        this[ANCHOR].after(...elements);
    }

    _getChildFragments() {
        return this[CHILDREN];
    }
}
