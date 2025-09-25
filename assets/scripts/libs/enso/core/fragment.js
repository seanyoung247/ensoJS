
import { processTemplate } from "./components.js";
import { runEffect } from "./effects";
import { ENV, SCHEDULE_UPDATE } from "./symbols.js";

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
    #component;             // Parent Component
    #anchor;                // Comment node defining the fragments DOM position
    #root = null;           // Mounted fragment root node

    #updateScheduled = false; // Is an update scheduled

    constructor(component, template, placeholder) {
        this.#component = component;
        this.#template = template;
        this.#anchor = document.createComment(this.placeholder);
        placeholder.replaceWith(this.#anchor);
 
        this.update = this.update.bind(this);
    }

    get placeholder() { return "enso:fragment"; }
    get component() { return this.#component; }
    get [ENV]() { return this.#component[ENV]; }

    [SCHEDULE_UPDATE]() {
        this.#updateScheduled = true;
        this.#component[SCHEDULE_UPDATE]();
    }

    //// Fragment Lifecycle
    mount() {
        processTemplate(this, this.#template);
    }

    markChanged(prop) {
        const bind = this.#bindings.get(prop);
        if (bind) {
            bind.changed = true;
            this[SCHEDULE_UPDATE]();
        }
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
