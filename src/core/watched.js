
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { watch } from "./watcher.js";
import { lifecycle, lifecycles } from "../component.js";
import { BINDINGS, MARK_CHANGED } from "./symbols.js";
import { ensoError } from "./errors.js";


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
export function prop(value = null, deep=false) {
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
export function attr(value = null, type = String) {
    const force = (value !== null && value !== undefined);

    if (force) {
        type = value.constructor;
    }

    if (!attributeTypes.includes(type) || (value !== null && typeof value === 'object')) {
        ensoError(201, type); // E_ATTR_BAD_TYPE
    }

    const { toProp, toAttr } = converters.get(type);
    return descripter({
        value: createFactory(value), deep: false, attribute: {
            type, force, toProp, toAttr
        }
    });
};

/**
 * Creates a computed watched property descriptor.
 *  - Reruns the given function and saves the return value whenever
 *      watched properties in deps change.
 * 
 * @param {Function} fn - Function to recalculate computed value.
 * @param {Array<String>} deps - Array of string watched property names.
 * @returns - A descriptor object defining the computed property.
 */
export function computed(fn, deps) {
    if (typeof fn !== 'function') {
        ensoError(211); // E_COMPUTED_FN
    }
    if (!Array.isArray(deps) || !deps.every(d => typeof d === 'string')) {
        ensoError(212); // E_COMPUTED_DEPS
    }
    if (!deps.includes(lifecycle.mount)) {
        deps.push(lifecycle.mount);
    }
    return descripter({
        value: undefined,
        deps,
        comp: fn, 
        deep: false, 
        attribute: false, 
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

/**
 * Tags a script method to be notified when watched properties change
 * @param {Function} fn     - The function to call
 * @param {[String]} props  - List of watched properties to watch
 * @returns {Function} The watcher function
 */
export function watches(fn, props = [], keep=false) {
    if (typeof fn === 'function' && fn.prototype !== undefined) {
        fn.__watches = { props, keep };
    } else {
        ensoError(221); // E_WATCHES_FN
    }
    return fn;
}

const VALUES = Symbol('enso.watched.values');

/**
 * Scans through the given script and collects any methods
 * that should be called when properties change.
 * @param {Object} script - The component's script object
 * @returns {Object} - Property keys with watching methods.
 */
export function parseScript(script) {
    const watchers = Object.create(null);
    if (!script) return watchers;

    const descriptors = Object.getOwnPropertyDescriptors(script);

    for (const [key, descriptor] of Object.entries(descriptors)) {
        if (!('value' in descriptor)) continue;

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

function validateName(name) {
    if (name.startsWith('_'))
        ensoError(231); // E_WATCHED_NAME
}

function createPropDesc(name, d, w) {
    const p = d && d._prop ? d : prop(d);
    p.name = name;
    p.watchers = w || [];
    return p;
}

export class Watched {

    // Builds a subclass of Watched tailored to the properties passed
    static define(properties, watchers={}) {
        const computed = [];
        const cls = class extends Watched {};
        cls.attr = [];
        cls.defs = Object.create(null);

        // For each watched property
        for (const [name, property] of Object.entries(properties)) {
            validateName(name);
            // Construct property description
            const prop = createPropDesc(name, property, watchers[name]);
            Object.defineProperty(cls.prototype, prop.name, {
                configurable: true,
                enumerable: true,
                get() {
                    return this._getProp(prop);
                },
                set(val) {
                    if (prop.comp) ensoError(213, prop.name); // E_COMPUTED_SET
                    this._setProp(prop, val);
                }
            });

            // If computed - flag for adding to watchers.
            if (prop.comp) computed.push(prop);

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
        for (const comp of computed) {
            const reCompute = function() { 
                this.watched._setProp(comp, comp.comp.call(this));
            }
            for (const dep of comp.deps) {
                const def = cls.defs[dep];
                if (def) {
                    def.watchers.push(reCompute);
                }
            }
        }
        Object.freeze(cls.defs);
        Object.freeze(cls.attr);
        return cls;
    }

    #component;                     // Component owner
    #values = Object.create(null);  // Holds the actual property values
    #bindings = Object.create(null);// Bindings for the watched properties

    constructor(component) {
        this.#component = component;
        // Property and binding setup
        for (const defName in this._defs) {
            const prop = this._defs[defName];
            let value = prop?.value?.();
            // Add accessors to component instance, and upgrade values if needed
            if (!prop.lifecycle) {
                if (component.hasOwnProperty(prop.name)) {
                    value = component[prop.name];
                }
                Object.defineProperty(component, prop.name, {
                    configurable: true,
                    enumerable: true,
                    get: () => this._getProp(prop),
                    set: (prop.comp)
                        ? ()=>{ ensoError(213, prop.name); } // E_COMPUTED_SET
                        : v => this._setProp(prop, v),
                });
            }

            // Wrap value in proxy if deep reactivity requested
            if (prop.deep && typeof value === 'object' && value !== null) {
                value = watch(value, prop.name, component[MARK_CHANGED]);
            }
            // Add to values map
            this.#values[defName] = value;
            // Create binding
            this.#bindings[defName] = {
                changed: false,             // Has value changed?
                watchers: prop.watchers,    // List of functions to notify of changes
                effects: [],                // List of effects to schedule on change
            };
        }
    }

    get [BINDINGS]() { return this.#bindings; }
    get [VALUES]() { return structuredClone(this.#values); }
    get _defs() { return this.constructor.defs; }

    _addWatcher(prop, fn) {
        if (this.#bindings[prop]) {
            this.#bindings[prop].watchers.push(fn);
        }
    }

    _notify(prop) {
        if (this.#bindings[prop]) {
            const { watchers } = this.#bindings[prop];
            const value = this.#values[prop];

            for (const watcher of watchers) {
                watcher.call(
                    this.#component, prop, value
                );
            }
        }
    }

    _getProp(prop) {
        return this.#values[prop.name];
    }

    _setProp(prop, value) {
        if (prop.deep && typeof value === 'object' && value !== null) {
            value = watch(value, prop.name, this.#component[MARK_CHANGED]);
        }

        this.#values[prop.name] = value;
        this.#component[MARK_CHANGED](prop.name);

        if (prop.attribute) this.#component.reflectAttribute(prop.name);
    }

    _update(values) {
        for (const val in values) {
            if (values[val] !== this.#values[val]) {
                this._setProp(this._defs[val], values[val]);
            }
        }
    }
}
