/**
 * @module Components Utillity functions for component handling
 */

//// Watched Properties
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

function createAttrDesc(attr, value, {
    type = String,        // Attribute data type
    force = false,        // Should the attribute be added by default?
}) {
    const {toProp, toAttr} = converters.get(type);

    if (!attributeTypes.includes(type)) {
        throw new Error(`Component attribute '${attr}' has unsupported type`);
    }

    // Force makes the attribute always appear whether set or not.
    // This makes no sense if there's no default value or for boolean flags.
    force = (force && (value !== null || type === Boolean));

    return { type, force, toProp, toAttr };
}

function createPropDesc(name, {
    prop = `_${name}`,      // Name of the data property
    deep = false,           // Should the property have shallow or deep reactivity
    value = null,           // Default property value
    attribute = false       // False or attribute properties
}) {
    if (attribute) {
        attribute = createAttrDesc(name, value, attribute);
        if (!attribute.force) value = null;
    }

    return { prop, deep, value, attribute };
}

/**
 * Adds accessor for a bound property
 */
export function defineWatchedProperty(cls, prop, desc) {
    const property = createPropDesc(prop, desc);

    // Has the component defined a callback function?
    const existing = Object.getOwnPropertyDescriptor(cls.prototype, prop);
    const setter = (existing && typeof existing.value === 'function') ?
        (o,v) => { o[property.prop] = v; existing.value.call(o,v) } : 
        (o,v) => { o[property.prop] = v; }

    Object.defineProperty(cls.prototype, prop, {
        configurable: true,
        enumerable: true,
        get() {
            // If deep need to return proxy -
            return this[property.prop] ?? property.value; 
        },
        set(val) {
            setter(this, val);
            this.markChanged(prop);
            this.reflectAttribute(prop);
            this.onPropertyChange(prop, val);
        }
    });

    return property;
}
