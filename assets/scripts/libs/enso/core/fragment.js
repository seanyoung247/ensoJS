import { runEffect } from "./effects";

/**
 * Enso Fragment base class
 * 
 * Represents a dynamic fragment of DOM that can be mounted and unmounted
 * based on conditions in the parent component.
 * 
 * Fragments are used to implement control flow directives such as *if and *for
 * 
 */
class EnsoFragment {
    #bindings = new Map();  // Bindings in this fragment
    #template;              // Template for this fragment
    #parent;                // Parent Component
    #anchor;                // Comment node defining the fragments DOM position
    #root = null;           // Mounted fragment root node

    #updateScheduled = false; // Is an update scheduled

    constructor(parent, template, anchor) {
        this.#parent = parent;
        this.#template = template;
        this.#anchor = anchor;
 
        this.update.bind(this);
    }

    get placeholder() { return "enso:fragment"; }
    get component() { return this.#parent; }

    //// Fragment Lifecycle
    mount() {

    }

    markChanged(prop) {
        const bind = this.#bindings.get(prop);
        if (bind) {
            bind.changed = true;
            return true;
        }
        return false;
    }

    update() {
        this.#updateScheduled = false;
        for (const bind of this.#bindings.values()) {
            if (bind.changed) {
                for (const effect of bind.effects) {
                    runEffect(this, effect);
                }
                bind.changed = false;
            }
        }
    }

    unmount() {}
}
