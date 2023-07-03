/**
 * @module Components Utillity functions for component handling
 */


/**
 * Adds read only properties with instance accessors to a class
 */
export function defineTypeConstants(cls, props) {
    const keys = Object.keys(props);

    for (const key of keys) {
        const prop = `_${key}`;
        Object.defineProperty(cls, prop, { value: props[key], writable: false });
        Object.defineProperty(cls.prototype, key, {
            get() { return this.constructor[prop]; }
        });
    }
}

export const attributeTypes = Object.freeze([
    Boolean, 
    Number,
    String
]);

const converters = (()=>{
    const converters = new Map();

    converters.set(Boolean, {
        toProp(val) { return (val !== 'false' && val !== null); },
        toAttr(val) { return val ? '' : null; }
    });
    converters.set(Number, {
        toProp(val) { return Number(val); },
        toAttr(val) { return val !== null ? String(val) : null; }
    });
    converters.set(String, {
        toProp(val) { return val; },
        toAttr(val) { return val; }
    });

    return converters;
})();

function createAttrDesc(attr, {
    type = String,        // Attribute data type
    force = false,        // Should the attribute be added by default?
}) {
    const {toProp, toAttr} = converters.get(type);

    if (!attributeTypes.includes(type)) {
        throw new Error(`Component attribute '${attr}' has unsupported type`);
    }

    // // Force makes the attribute always appear whether set or not.
    // // This makes no sense if there's no default value or for boolean flags.
    // force = (force && (value !== null || type === Boolean));
    // if (!force) value = null;

    return { type, force, toProp, toAttr };
}

function createPropDesc(name, {
    prop = `_${name}`,      // Name of the data property
    deep = false,           // Should the property have shallow or deep reactivity
    value = null,           // Default property value
    attribute = false       // False or attribute properties
}) {
    if (attribute) attribute = createAttrDesc(name, attribute);

    return {prop, deep, value, attribute};
}

/**
 * Adds or wraps a property getter and setter for a given attribute to
 * an Enso component
 */
export function defineAttribute(cls, attr, desc) {
    const attribute = createAttrDesc(attr, desc);
    // If there's already an accessor defined, wrap it
    const existing = Object.getOwnPropertyDescriptor(cls.prototype, attr);
    const setter = (existing && existing.set) ? 
        (o,v) => { o[attribute.prop] = v; existing.set.call(o,v) } : 
        (o,v) => { o[attribute.prop] = v; }

    // Accessor property
    Object.defineProperty(cls.prototype, attr, {
        configurable: true,
        enumerable: true,
        get() { return this[attribute.prop] ?? attribute.value; },
        set(val) {
            setter(this, val);
            // Mark as dirty here
            this.onPropertyChange(attr, val);
        }
    });

    return attribute;
}



export function defineProperty(obj, prop, desc) {

}

export function bindProperty() {
    
}