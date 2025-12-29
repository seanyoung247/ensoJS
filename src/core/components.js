
/**
 * @module components Utillity functions for component handling
 */

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { 
    MARK_CHANGED, GET_BINDING, ADD_BINDING, TASK_LIST,
    SCHEDULE_EFFECT, SCHEDULE_UPDATE, UPDATE,
    ENSO_INTERNAL, BINDINGS, CHILDREN, ADD_CHILD
} from "./symbols.js";

/** Creates a derived class from a base class and Object Literal mixin */
export const createComponent = (base, proto) => {
    const component = class extends base { constructor() { super(ENSO_INTERNAL); } };

    // If no custom code implementation:
    if (!proto) return component;

    // Check that we've been given an Object litteral
    const cType = typeof proto;
    if (cType !== 'object') {
        throw new Error(`Component expected object litteral but got ${ cType }`);
    }

    // Pull the custom fields out of the object mixin and add them to the component prototype
    const descriptors = Object.getOwnPropertyDescriptors(proto);
    for (const prop in descriptors) {
        Object.defineProperty(component.prototype, prop, descriptors[prop]);
    }

    return component;
};

/** Defines functionality shared by Components and Fragments */
export const EnsoNode = (Base = Object) => {
    return class extends Base {
        #bindings;              // Bindings in this node
        #taskList = new Set();  // Set of effects to be run during the next update
        #children = [];         // Child nodes

        constructor() {
            super();
            this[UPDATE] = this[UPDATE].bind(this);
            this[MARK_CHANGED] = this[MARK_CHANGED].bind(this);
        }

        get isComponent() { return false; }

        //// Accessors - Framework internal
        get [BINDINGS]() { return this.#bindings; }
        set [BINDINGS](bindings) { this.#bindings = bindings; }
        get [TASK_LIST]() { return this.#taskList; }
        get [CHILDREN]() { return this.#children; }

        [ADD_CHILD](fragment) {
            this.#children.push(fragment);
        }

        [GET_BINDING](bind) { return this.#bindings.get(bind); }
        [ADD_BINDING](bind, effect) {
            const binding = this[GET_BINDING](bind);
            if (binding) {
                binding.effects.push(effect);
                binding.changed = true;
            }
        }

        [SCHEDULE_EFFECT](effect) {
            this.#taskList.add(effect);
        }

        [MARK_CHANGED](prop) {
            const bind = this.#bindings.get(prop);
            if (bind && !bind.changed) {
                bind.changed = true;

                for (const effect of bind.effects) {
                    this[SCHEDULE_EFFECT](effect);
                }
                this[SCHEDULE_UPDATE]();
            }

            for (const child of this.#children) {
                child[MARK_CHANGED](prop);
            }
        }

        [UPDATE]() {
            // run all effects in the task list
            for (const effect of this.#taskList) {
                effect.run();
            }
            this.#taskList.clear();

            // reset all bindings
            for (const bind of this.#bindings.values()) {
                bind.changed = false;
            }

            // recurse into children safely
            const children = [...this.#children];
            for (const child of children) {
                child[UPDATE]();
            }
        }
    };
};

