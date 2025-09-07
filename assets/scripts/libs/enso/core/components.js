
/**
 * @module components Utillity functions for component handling
 */


//// Mixins

/** Creates a derived class from a base class and Object Literal mixin */
export const createComponent = (base, proto) => {
    const component = class extends base {};

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
    const {toProp, toAttr} = converters.get(type);

    if (!attributeTypes.includes(type)) {
        throw new Error(`Component attribute '${attr}' has unsupported type`);
    }
    // Force makes the attribute always appear whether set or not.
    // This makes no sense if there's no default value or for boolean flags.
    force = (force && (value !== null || type !== Boolean));

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
        // To remove an attribute its value is null, so a non-forced attribute
        // must have a default value of null
        if (!attribute.force) value = null;
        // No point having deep reactivity on an attribute that can only be a
        // simple data type
        deep = false;
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
        (o,v) => { o[property.prop] = v; existing.value.call(o,v); } : 
        (o,v) => { o[property.prop] = v; };

    Object.defineProperty(cls.prototype, prop, {
        configurable: true,
        enumerable: true,
        get() {
            // ToDo: If deep need to return proxy -
            return this[property.prop] ?? property.value; 
        },
        set(val) {
            setter(this, val);
            this.markChanged(prop);

            if (property.attribute) this.reflectAttribute(prop);
            this.onPropertyChange(prop, val);
        }
    });

    return property;
}

