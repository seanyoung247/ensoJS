/**
 * @module Objects Utillity functions for object handling
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

/**
 * Adds property getter and setter and reflection for a given attribute to
 * an Enso component
 */
export function defineAttribute(cls, attribute, value, type) {
    const prop = `_${attribute}`;
    const reflect = (type === Boolean) ?
        (el, val) => { 
            if (val) el.setAttribute(attribute, ''); 
            else el.removeAttribute(attribute);
        } :
        (el, val)  => { el.setAttribute(attribute, val) };

    // If there's already an accessor defined, wrap it in a reflector
    const existing = Object.getOwnPropertyDescriptor(cls.prototype, attribute);
    const setter = (existing && existing.set) ? 
        (o,v) => { o[prop] = v; existing.set.call(o,v) } : 
        (o,v) => { o[prop] = v; }

    // Accessor property
    Object.defineProperty(cls.prototype, attribute, {
        configurable: true,
        enumerable: true,
        get() { return this[prop] ?? value; },
        set(val) { 
            setter(this, val);
            reflect(this, val);
            this.onPropertyChange(attribute, val);
        }
    });
}

