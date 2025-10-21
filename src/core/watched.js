
import { watch } from "./watcher.js";
import { lifecycles } from "../component.js";
import { BINDINGS, MARK_CHANGED } from "./symbols.js";

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

function createAttrDesc(attr, value, options = {}) {
    // Allow shorthand boolean for attribute presence
    if (typeof options === 'boolean') options = {};

    let { type = String, force = false } = options;

    if (!converters.has(type) || !attributeTypes.includes(type)) {
        throw new Error(`Component attribute '${attr}' has unsupported type`);
    }

    const { toProp, toAttr } = converters.get(type);

    // Force attribute if user asked for it OR if a default value exists
    force = force || (value !== null && value !== undefined);

    return { type, force, toProp, toAttr };
}

function createPropDesc(name, desc, watchers = []) {
    // Support shorthand: count: 0
    if (desc !== Object(desc)) desc = { value: desc };

    let { deep = false, value = null, attribute = false } = desc;

    if (attribute) {
        attribute = createAttrDesc(name, value, attribute);
        // Automatically force attribute if default value exists
        if (value !== null && value !== undefined) {
            attribute.force = true;
        }
        // Attributes are always shallow
        deep = false;
    }

    return { name, deep, value, attribute, watchers };
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

/**
 * Tags a script method to be notified when watched properties change
 * @param {Function} fn     - The function to call
 * @param {[String]} props  - List of watched properties to watch
 * @returns {Function} The watcher function
 */
export function watches(fn, props, keep=false) {
    if (typeof fn === 'function') {
        fn.__watches = { props, keep };
    }
    return fn;
}

/**
 * Scans through the given script and collects any methods
 * that should be called when properties change.
 * @param {Object} script - The component's script object
 * @returns {Object} - Property keys with watching methods.
 */
export function parseScript(script) {
    const watchers = Object.create(null);
    if (!script) return watchers;

    for (const [key, fn] of Object.entries(script)) {
        if (fn?.__watches) {
            for (const prop of fn.__watches.props) {
                (watchers[prop] ||= []).push(fn);
            }
            if (!fn.__watches.keep) delete script[key];
        }
    }
    return watchers;
}

export class Watched {

    // Builds a subclass of Watched tailored to the properties passed
    static define(properties, watchers={}) {
        const cls = class extends Watched {};
        cls.attr = [];
        cls.defs = Object.create(null);

        // For each watched property
        for (const [name, property] of Object.entries(properties)) {
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
        for (const defName in this.defs) {
            const prop = this.defs[defName];
            let value = prop.value;
            // Wrap value in proxy if deep reactivity requested
            if (prop.deep && typeof value === 'object' && value !== null) {
                value = watch(value, prop.name, component[MARK_CHANGED]);
            }
            // Add to values map
            this.#values.set(defName, value);
            // create binding
            this.#bindings.set(defName, {
                changed: false,             // Has value changed?
                watchers: prop.watchers,    // List of functions to notify of changes
                effects: [],                // List of effects to schedule on change
            });
        }
        // Add lifecycle bindings
        for (const lifecycle of lifecycles) {
            this.#bindings.set(lifecycle, {changed: false, watchers: [], effects: []});
        }
    }

    get [BINDINGS]() { return this.#bindings; }
    get [VALUES]() { return Object.fromEntries(this.#values); }
    get defs() { return this.constructor.defs; }

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

    update(values) {
        for (const val in values) {
            if (values[val] !== this.#values.get(val)) {
                this._setProp(this.defs[val], values[val]);
            }
        }
    } 
}
