
/**
 * @module components Utillity functions for component handling
 */

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

// import { watch } from "./watcher.js";
import { runEffect } from "./effects.js";
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


//// Watched Properties
export const attributeTypes = Object.freeze([
    Boolean, Number, String
]);

const converters = new Map([
    [Boolean, {
        toProp(val) { return (val !== 'false' && val !== null); },
        toAttr(val) { return val ? '' : null; }
    }],
    [Number, {
        toProp(val) { return Number(val); },
        toAttr(val) { return val !== null ? String(val) : null; }
    }],
    [String, {
        toProp(val) { return val; },
        toAttr(val) { return val; }
    }]
]);

function createAttrDesc(attr, value, {
    type = String,        // Attribute data type
    force = false,        // Should the attribute be added by default?
}) {
    if (!converters.has(type) || !attributeTypes.includes(type)) {
        throw new Error(`Component attribute '${attr}' has unsupported type`);
    }
    const {toProp, toAttr} = converters.get(type);
    // Force makes the attribute always appear whether set or not.
    // This makes no sense if there's no default value or for boolean flags.
    force = (force && (value !== null || type !== Boolean));

    return { type, force, toProp, toAttr };
}

function createPropDesc(name, desc) {

    if (desc !== Object(desc)) desc = { value: desc };

    let {
        deep = false,       // Should the property have shallow or deep reactivity
        value = null,       // Default property value
        attribute = false   // False or attribute properties
    } = desc;

    if (attribute) {
        attribute = createAttrDesc(name, value, attribute);
        // To remove an attribute its value is null, so a non-forced attribute
        // must have a default value of null
        if (!attribute.force) value = null;
        // No point having deep reactivity on an attribute that can only be a
        // simple data type
        deep = false;
    }

    return { name, deep, value, attribute };
}

const VALUES = Symbol('enso.watched.values');
/**
 * Get all watched values for a given component.
 * 
 * @param {EnsoComponent} component - The component to retrieve watched values from.
 * @returns {Object<string, any>} An object literal containing all watched properties.
 */
export function getWatched(component) {
    return component.watched[VALUES];
}

/**
 * Set multiple watched values on a component, and triggers updates for changes.
 *
 * @param {EnsoComponent} component - The component whose watched values are being updated.
 * @param {Object<string, any>} values - Object containing key/value pairs to update.
 */
export function setWatched(component, values) {
    component.watched.update(values);
}

export class Watched {

    static define(properties) {
        const cls = class extends Watched {};
        const attr = [];
        cls.defs = {};

        for (const [name, property] of Object.entries(properties)) {
            const prop = createPropDesc(name, property);
            Object.defineProperty(cls.prototype, prop.name, {
                configurable: true,
                enumerable: true,
                get() {
                    return this._getProp(prop);
                },
                set(val) {
                    this._setProp(prop, val);
                }
            });
            cls.defs[prop.name] = prop;
            if (prop.attribute) attr.push(prop.name);
        }
        Object.freeze(cls.defs);
        Object.freeze(attr);
        return [cls, attr];
    }

    #values = {};
    #component;

    constructor(component) {
        this.#component = component;
        for (const def in this.defs) {
            this.#values[def] = this.defs[def].value;
        }
    }

    get [VALUES]() { return this.#values; }
    get defs() { return this.constructor.defs; }

    _getProp(prop) {
        return this.#values[prop.name] ?? prop.value;
    }
    _setProp(prop, value) {
        this.#values[prop.name] = value;
        this.#component[MARK_CHANGED](prop.name);

        if (prop.attribute) this.#component.reflectAttribute(prop);
        this.#component.onPropertyChange(prop.name, value);
    }

    update(values) {
        for (const val in values) {
            if (values[val] !== this.#values[val]) {
                this._setProp(this.defs[val], values[val]);
            }
        }
    } 
}

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
        runEffect(owner, effect);
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
