
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { markChanged, processTemplate, update } from "./components.js";
import { runEffect, createEffectEnv } from "./effects.js";
import { 
    ROOT, ENV, ADD_CHILD, GET_BINDING,
    SCHEDULE_UPDATE, ATTACH_TEMPLATE,
    BINDINGS, CHILDREN,
    UPDATE, MARK_CHANGED
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
export class EnsoFragment {
    #bindings = new Map();  // Bindings in this fragment
    #template;              // Template for this fragment
    #component;             // Root component
    #parent;                // Parent fragment
    #anchor;                // Comment node defining the fragments DOM position
    #root = null;           // Fragment root node
    #env;                   // Effect environment

    #children = [];         // Child fragments

    #attached = false;      // Is the fragment currently attached to the DOM?
    #updateScheduled = false; // Is an update scheduled

    constructor(parent, template, placeholder) {
        this.#component = parent.component;
        this.#template = template;
        this.#parent = parent;
        this.#env = parent[ENV];

        // Remove the searchable placeholder node and replace with a comment anchor
        this.#anchor = document.createComment(this.tag);
        placeholder.replaceWith(this.#anchor);

        // Register with parent
        parent[ADD_CHILD](this);
 
        this[UPDATE] = this[UPDATE].bind(this);
    }

    //// Accessors - Public
    get tag() { return "enso:fragment"; }
    get component() { return this.#component; }
    get isAttached() { return this.#attached; }

    //// Accessors - Framework internal
    get [BINDINGS]() { return this.#bindings; }
    get [CHILDREN]() { return this.#children; }
    get [ROOT]() { return this.#root; }
    get [ENV]() { return this.#env; }
    set [ENV](env) {
        this.#env = createEffectEnv(env, this.#parent[ENV]);
    }

    get #parentAttached() { return this.#parent.isAttached; }

    [ADD_CHILD](fragment) {
        this.#children.push(fragment);
    }

    [GET_BINDING](bind) {
        return this.#bindings.get(bind) || this.#parent[GET_BINDING](bind); 
    }

    //// Fragment Lifecycle
    [ATTACH_TEMPLATE](DOM) {
        this.#root = DOM.firstElementChild;
        this.#anchor.after(DOM);

        this.#attached = true;
        this[UPDATE]();
    }

    [SCHEDULE_UPDATE]() {
        this.#updateScheduled = true;
        this.#component[SCHEDULE_UPDATE]();
    }

    mount() {
        if (this.#attached || !this.#parentAttached) return;

        if (!this.#root) {
            processTemplate(this, this.#template);
        } else {
            this.#anchor.after(this.#root);
            this.#attached = true;
            this[UPDATE]();
        }
    }

    [MARK_CHANGED](prop) { markChanged(this, prop); }

    [UPDATE]() {
        if (!this.#updateScheduled || !this.#attached) return;

        this.#updateScheduled = false;

        update(this);
    }

    unmount() {
        this.#root?.remove();
        this.#attached = false;
    }
}
