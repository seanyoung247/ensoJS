
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { EnsoNode } from "./components.js";
import { createEffectEnv } from "./effects.js";
import { 
    NODES, ENV, ADD_CHILD, SCHEDULE_UPDATE,
    BINDINGS, UPDATE, ANCHOR,
} from "./symbols.js";

/**
 * Enso Fragment base class
 * 
 * Represents a dynamic fragment of DOM that can be mounted and unmounted
 * based on conditions in the parent component.
 * 
 * Fragments are used to implement control flow directives such as *if and *for
 * 
 */
export class EnsoFragment extends EnsoNode() {
    #component;             // Root component
    #parent;                // Parent fragment
    #anchor;                // Comment node defining the fragments DOM position
    #nodes = null;          // Fragment root node
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

        const node = template.process(this).firstElementChild;
        if (node instanceof HTMLTemplateElement) {
            this.#nodes = Array.from(node.content.childNodes);
        } else {
            this.#nodes = [node];
        }
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

        this.#anchor.after(...this.#nodes);
        this.#attached = true;
        this[UPDATE]();
    }

    [UPDATE]() {
        if (!this.#attached) return;
        super[UPDATE]();
    }


    unmount() {
        for (const node of this.#nodes) node.remove();
        this.#attached = false;
    }
}
