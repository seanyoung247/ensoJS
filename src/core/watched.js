
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { watch } from "./watcher.js";
import { lifecycles } from "../component.js";
import { BINDINGS, MARK_CHANGED } from "./symbols.js";


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

function createFactory(value) {
    if (typeof value === 'function') return value;

    if (value === null || typeof value !== 'object') {
        return () => value;
    }

    return () => structuredClone(value);
}

//// USER FACING

const descripter = (desc) => Object.defineProperty(desc, '_prop', {
    value: true, writable: false, configurable: false, enumerable: false
});

/**
 * Create a watched property descriptor.
 *
 * - If `deep` is true AND `value` is a non-null object, deep reactivity is enabled.
 * - Primitive values always produce shallow descriptors.
 *
 * @param {*} value - Initial property value.
 * @param {boolean} [deep=false] - Whether to enable deep reactivity if the value is an object.
 * @returns {object} - A property descriptor object consumed by the watched system.
 */
export const prop = (value = null, deep=false) => {
    deep = deep && (value !== null && typeof value === 'object');
    return descripter({
        value: createFactory(value), deep, attribute: false
    });
};

/**
 * Create a watched attribute descriptor (string/number/boolean).
 *
 * - Automatically detects type from the default value if provided.
 * - Rejects object values and unsupported constructors.
 *
 * @param {string|number|boolean|null} value - Default attribute value. If non-null, determines the attribute type unless explicitly overridden.
 * @param {Function} [type=String] - Constructor representing the expected attribute type (String, Number, Boolean).
 * @throws {Error} - If value is an object, or type is not in the allowed attributeTypes list.
 * @returns {object} - A descriptor object defining attribute parsing, serialisation, and reactivity.
 */
export const attr = (value = null, type = String) => {
    const force = (value !== null && value !== undefined);

    if (force) {
        type = value.constructor;
    }

    if (!attributeTypes.includes(type) || (value !== null && typeof value === 'object')) {
        throw new Error(
            `Unsupported attribute type '${type}'. Allowed: ${
                attributeTypes.map(t => t.name).join(', ')
            }`
        );
    }

    const { toProp, toAttr } = converters.get(type);
    return descripter({
        value: createFactory(value), deep: false, attribute: {
            type, force, toProp, toAttr
        }
    });
};

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
    component.watched._update(values);
}

const isFunction = fn => typeof fn === 'function' && fn.prototype !== undefined;
/**
 * Tags a script method to be notified when watched properties change
 * @param {Function} fn     - The function to call
 * @param {[String]} props  - List of watched properties to watch
 * @returns {Function} The watcher function
 */
export function watches(fn, props = [], keep=false) {
    if (isFunction(fn)) {
        fn.__watches = { props, keep };
    } else {
        throw new Error("[Enso] - Watches can only be applied to functions.");
    }
    return fn;
}

const VALUES = Symbol('enso.watched.values');

const objEntries = obj => Object.entries(Object.getOwnPropertyDescriptors(obj));
/**
 * Scans through the given script and collects any methods
 * that should be called when properties change.
 * @param {Object} script - The component's script object
 * @returns {Object} - Property keys with watching methods.
 */
export function parseScript(script) {
    const watchers = Object.create(null);
    if (!script) return watchers;

    for (const [key, descriptor] of objEntries(script)) {
        const fn = descriptor.value;
        if (fn?.__watches) {
            for (const prop of fn.__watches.props) {
                (watchers[prop] ||= []).push(fn);
            }
            if (!fn.__watches.keep) delete script[key];
        }
    }
    return watchers;
}

const validateName = (name) => {
    if (name.startsWith('_'))
        throw new Error("[Enso] - Watched property names must not start with '_'.");
};

const createPropDesc = (name, desc, watchers = []) => {
    const propDesc = desc?._prop ? desc : prop(desc);
    return Object.assign({}, propDesc, { name, watchers });
};

export class Watched {

    // Builds a subclass of Watched tailored to the properties passed
    static define(properties, watchers={}) {
        const cls = class extends Watched {};
        cls.attr = [];
        cls.defs = Object.create(null);

        // For each watched property
        for (const [name, property] of Object.entries(properties)) {
            validateName(name);
            // Construct property description
            const prop = createPropDesc(name, property, watchers[name]);
            // Add accessors for the property
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
            // Insert definitions and observed attributes
            cls.defs[prop.name] = prop;
            if (prop.attribute) cls.attr.push(prop.name);
        }
        for (const lifecycle of lifecycles) {
            cls.defs[lifecycle] = { 
                name: lifecycle, 
                value: () => false,
                attribute: false,
                watchers: watchers[lifecycle] ?? [],
                lifecycle: true,
            };
        }
        Object.freeze(cls.defs);
        Object.freeze(cls.attr);
        return cls;
    }

    #component;             // Component owner
    #values = new Map();    // Holds the actual property values
    #bindings = new Map();  // Bindings for the watched properties

    constructor(component) {
        this.#component = component;
        // Property and binding setup
        for (const defName in this._defs) {
            const prop = this._defs[defName];
            let value = prop.value();
            // Add accessors to component instance, and upgrade values if needed
            if (!prop.lifecycle) {
                if (component.hasOwnProperty(prop.name)) {
                    value = component[prop.name];
                }
                Object.defineProperty(component, prop.name, {
                    configurable: true,
                    enumerable: true,
                    get: () => this._getProp(prop),
                    set: v => this._setProp(prop, v),
                });
            }

            // Wrap value in proxy if deep reactivity requested
            if (prop.deep && typeof value === 'object' && value !== null) {
                value = watch(value, prop.name, component[MARK_CHANGED]);
            }
            // Add to values map
            this.#values.set(defName, value);
            // Create binding
            this.#bindings.set(defName, {
                changed: false,             // Has value changed?
                watchers: prop.watchers,    // List of functions to notify of changes
                effects: [],                // List of effects to schedule on change
            });
        }
    }

    get [BINDINGS]() { return this.#bindings; }
    get [VALUES]() { return Object.fromEntries(this.#values); }
    get _defs() { return this.constructor.defs; }

    _notify(prop) {
        if (this.#bindings.has(prop)) {
            const { watchers } = this.#bindings.get(prop);
            const value = this.#values.get(prop);

            for (const watcher of watchers) {
                watcher.call(
                    this.#component, prop, value
                );
            }
        }
    }

    _getProp(prop) {
        return this.#values.get(prop.name);
    }
    _setProp(prop, value) {
        if (prop.deep && typeof value === 'object' && value !== null) {
            value = watch(value, prop.name, this.#component[MARK_CHANGED]);
        }

        this.#values.set(prop.name, value);
        this.#component[MARK_CHANGED](prop.name);

        if (prop.attribute) this.#component.reflectAttribute(prop.name);
        this._notify(prop.name);
    }

    _update(values) {
        for (const val in values) {
            if (values[val] !== this.#values.get(val)) {
                this._setProp(this._defs[val], values[val]);
            }
        }
    }
}
