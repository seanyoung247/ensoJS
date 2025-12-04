/**
 * @module loaders - Defines template file loaders
 */
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import EnsoTemplate from "../templates/template.js";
import { createStyleSheet } from "./css.js";

const extension = /(?:\w+\.)(\w+)(?:$||\?)/;


const getUrl = (resolver, file) => new URL(file, resolver).href;

export const load = {

    /**
     * Load multiple files in parallel using their extensions to select loaders.
     *
     * This method **requires**:
     *   - A base resolver (string URL or resolver function)
     *   - One or more file paths (strings)
     *
     * If called with only a single absolute URL instead of (resolver, file),
     * this method will throw — unlike other loaders which treat a single
     * argument as the full URL.
     * @param {string|Function} resolver - A base URL (eg. import.meta.url) or resolver function.
     * @param  {...string} args - One or more relative file paths.
     * @returns {Promise<Array<*>>} - The loaded results for each file.
     * 
     * @eample await load.all(import.meta.url, "./a.json", "./b.css", "./view.html");
     */
    all(resolver, ...args) {
        return Promise.all( args.map(file => {
            // Try and guess the file type from the extension
            const loader = this[file.match(extension)[1]] ?? this.text;
            return loader.call(this, resolver, file);
        }));
    },

    /**
     * Loads a Json file and parses.
     * @param {string|Function} resolver - A base URL (eg. import.meta.url), resolver function, or url path.
     * @param {string} [file] - If provided is a relative path to the file from the resolver.
     * @returns {Promise<*>} - Parsed JSON data.
     * @example await load.json(import.meta.url, "./a.json");
     * @example await load.json("/assets/a.json");
     */
    json(resolver, file) {
        return this.load(resolver, file)
            .then(responce => responce.json());
    },

    /**
     * Loads a text file
     * @param {string|Function} resolver - A base URL (eg. import.meta.url), resolver function, or url path.
     * @param {string} [file] - If provided is a relative path to the file from the resolver.
     * @returns {Promise<string>} - The text content of the file.
     * @example await load.text(import.meta.url, "./t.text");
     * @example await load.text("/assets/t.text");
     */
    text(resolver, file) {
        return this.load(resolver, file)
            .then(responce => responce.text());
    },
    /**
     * Loads a css file and processes it into a CSSStyleSheet Object.
     * @param {string|Function} resolver - A base URL (eg. import.meta.url), resolver function, or url path
     * @param {string} [file] - If provided is a relative path to the file from the resolver
     * @returns {Promise<CSSStyleSheet>} - CSS formated into a CSSStyleSheet Object
     * @example await load.css(import.meta.url, "./s.css");
     * @example await load.css("/assets/s.css");
     */
    css(resolver, file) {
        return this.text(resolver, file)
            .then(css => createStyleSheet(css));
    },

    /**
     * Loads a html file and parses it as an EnsoTemplate that can be added to an Enso component.
     * @param {string|Function} resolver - A base URL (eg. import.meta.url), resolver function, or url path
     * @param {string} [file] - If provided is a relative path to the file from the resolver
     * @returns {Promise<EnsoTemplate} - HTML parsed as an EnsoTemplate.
     * @example await load.text(import.meta.url, "./h.html");
     * @example await load.text("/assets/h.html");
     */
    html(resolver, file) {
        return this.text(resolver, file)
            .then(html => new EnsoTemplate(html));
    },

    load(resolver, file) {
        if (typeof resolver === 'function') {
            file = resolver(file);
        } else if (typeof resolver === 'string' && file) {
            file = getUrl(resolver, file);
        } else {
            file = resolver;
        }
        return fetch(file);
    }

};
