/**
 * @module Objects Utillity functions for object handling
 */


/**
 * Adds read only properties with instance accessors to a class
 * @param {Class} cls - The class to add properties to
 * @param {Object} props - Object defining property names and values
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