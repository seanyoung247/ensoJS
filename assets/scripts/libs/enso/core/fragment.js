
import { processTemplate } from "./components.js";
import { runEffect } from "./effects";
import { ROOT, ENV, ADD_CHILD, SCHEDULE_UPDATE } from "./symbols.js";

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
    #anchor;                // Comment node defining the fragments DOM position
    #children = [];         // Child fragments

    #attached = false;      // Is the fragment currently attached to the DOM?
    #root = null;           // Mounted fragment root node
    #updateScheduled = false; // Is an update scheduled

    constructor(parent, template, placeholder) {
        this.#component = parent.component;
        this.#template = template;
        this.#anchor = document.createComment(this.tag);
        placeholder.replaceWith(this.#anchor);

        parent[ADD_CHILD](this);
 
        this.update = this.update.bind(this);
    }

    get tag() { return "enso:fragment"; }
    get component() { return this.#component; }
    get [ENV]() { return this.#component[ENV]; }
    get [ROOT]() { return this.#root; }

    [ADD_CHILD](fragment) {
        this.#children.push(fragment);
    }


    //// Fragment Lifecycle
    [ATTACH_TEMPLATE](DOM) {
        this.#anchor.after(DOM);
        this.#root = DOM;
        this.#attached = true;
        this.update();
    }

    [SCHEDULE_UPDATE]() {
        this.#updateScheduled = true;
        this.#component[SCHEDULE_UPDATE]();
    }

    mount() {
        if (this.#attached) return;

        if (!this.#root) {
            processTemplate(this, this.#template);
        } else {
            requestAnimationFrame( () => this[ATTACH_TEMPLATE](this.#root) );
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
