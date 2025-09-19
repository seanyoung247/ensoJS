/**
 * @module uuid - Defines a basic non-secure UUID generator.
 * 
 *   Based on the non-secure version of the Nanoid library.
 */

const alphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'

/**
 * Generates a simple, non-secure UUID of variable length
 * @param {Number} length - Length of the UUID to generate (default 6)
 * @returns {String} - The generated UUID
 */
export const uuid = (length = 6) => {
    let id = '', i = Math.max(0, Math.trunc(length));
    const al = alphabet.length;
    while (i--) id += alphabet[Math.trunc(Math.random() * al)]
    return id;
}

/**
 * Provides a function that generates a series of unique IDs for a scope.
 * All IDs generated from the same function share the same random base string,
 * with only the counter incrementing.
 * @param {String} prefix - A desired prefix for the ID
 * @param {Number} length - Length of the unique part of the ID (default 6)
 * @returns {Function} - A function that generates a scoped ID each time it is called
 */
export const scopedId = (prefix="enso", length=6) => {
    const base = uuid(length);
    let counter = 1;
    return () => `${prefix}-${base}-${counter++}`;
}
