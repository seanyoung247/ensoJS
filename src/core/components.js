
/**
 * @module components Utillity functions for component handling
 */

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { 
    UPDATE, MARK_CHANGED, GET_BINDING, TASK_LIST,
    SCHEDULE_EFFECT, SCHEDULE_UPDATE, 
    ENSO_INTERNAL, BINDINGS, CHILDREN,
} from "./symbols.js";

//// Mixins

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

//// Component/Fragment lifecycle methods
export function markChanged(owner, prop) {
    const bind = owner[GET_BINDING](prop);
    if (bind && !bind.changed) {
        bind.changed = true;

        for (const effect of bind.effects) {
            owner[SCHEDULE_EFFECT](effect);
        }
        owner[SCHEDULE_UPDATE]();
    }

    for (const child of owner[CHILDREN]) {
        child[MARK_CHANGED](prop);
    }
}

export function update(owner) {

    // run all effects once
    for (const effect of owner[TASK_LIST]) {
        effect.run();
    }
    owner[TASK_LIST].clear();

    // reset all bindings
    for (const bind of owner[BINDINGS].values()) {
        bind.changed = false;
    }

    // recurse into children safely
    const children = [...owner[CHILDREN]];
    for (const child of children) {
        child[UPDATE]();
    }
}
