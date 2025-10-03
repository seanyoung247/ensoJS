
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { processTemplate } from "./components.js";
import { runEffect, createEffectEnv } from "./effects.js";
import { 
    ROOT, ENV, ADD_CHILD, GET_BINDING,
    SCHEDULE_UPDATE, ATTACH_TEMPLATE
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
    #root = null;           // Mounted fragment root node
    #env;                   // Effect environment

    #children = [];         // Child fragments

    #attached = false;      // Is the fragment currently attached to the DOM?
    #updateScheduled = false; // Is an update scheduled

    constructor(parent, template, placeholder) {
        this.#component = parent.component;
        this.#template = template;
        this.#parent = parent;

        this.#env = createEffectEnv(this.#component.expose, this.#component[ENV]);

        // Remove the searchable placeholder node and replace with a comment anchor
        this.#anchor = document.createComment(this.tag);
        placeholder.replaceWith(this.#anchor);

        // Register with parent
        parent[ADD_CHILD](this);
 
        this.update = this.update.bind(this);
    }

    get tag() { return "enso:fragment"; }
    get component() { return this.#component; }
    get isAttached() { return this.#attached; }

    get [ROOT]() { return this.#root; }
    get [ENV]() { return this.#env; }
    set [ENV](env) {
        this.#env = createEffectEnv(env, this.#component[ENV]);
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
        this.update();
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
            this.update();
        }
    }

    markChanged(prop) {
        const bind = this.#bindings.get(prop);
        if (bind) {
            bind.changed = true;
            this[SCHEDULE_UPDATE]();
        }
        for (const child of this.#children) {
            child.markChanged(prop);
        }
    }

    update() {
        if (!this.#updateScheduled || !this.#attached) return;

        this.#updateScheduled = false;
        for (const bind of this.#bindings.values()) {
            if (bind.changed) {
                for (const effect of bind.effects) {
                    runEffect(this, effect);
                }
                bind.changed = false;
            }
        }
        for (const child of this.#children) {
            child.update();
        }
    }

    unmount() {
        this.#root?.remove();
        this.#attached = false;
    }
}
