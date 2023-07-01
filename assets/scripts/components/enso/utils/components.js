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

    converters.set(Boolean, {});
    converters.set(Number, {});
    converters.set(String, {});

    return converters;
})();

function createAttrDesc(attr, {
    type = String,        // Attribute data type
    prop = `_${attr}`,    // Name of the data property
    show = false,         // Should the attribute always be added?
    value = null          // Default value
}) {
    const dirty = false;  // Has the attribute changed since last update?
    const remove = false; // Should this attribute be removed on the next update?
    const convert = converters.get(type);

    if (!attributeTypes.includes(type)) {
        throw new Error(`Component attribute '${attr}' has unsupported type`);
    }

    return { name:attr, prop, type, show, value, dirty, convert };
}

/**
 * Adds or wraps a property getter and setter for a given attribute to
 * an Enso component
 */
export function defineAttribute(cls, attr, desc) {
    const attribute = createAttrDesc(attr, desc);
    // If there's already an accessor defined, wrap it
    const existing = Object.getOwnPropertyDescriptor(cls.prototype, attribute.name);
    const setter = (existing && existing.set) ? 
        (o,v) => { o[attribute.prop] = v; existing.set.call(o,v) } : 
        (o,v) => { o[attribute.prop] = v; }

    // Accessor property
    Object.defineProperty(cls.prototype, attribute.name, {
        configurable: true,
        enumerable: true,
        get() { return this[attribute.prop] ?? attribute.value; },
        set(val) { 
            setter(this, val);
            attribute.dirty = true;
            this.onPropertyChange(attribute.name, val);
        }
    });

    return attribute;
}
