
/**
 * @module load
 * Loader utilities for fetching external resources relative to a calling module.
 *
 * Usage:
 *   // Single load
 *   const [cssText] = await load(import.meta.url, "./style.css");
 *   // Multiple loads
 *   const [styles, template] = await load(
 *     import.meta.url,
 *     { file: "./style.css", as: css },
 *     { file: "./template.html", as: html }
 *   );
 */

const getUrl = (base, file) => {
    // Resolver mode
    if (typeof base === "function") {
        return base(file);
    }
    // Base URL mode
    if (typeof base === "string" && typeof file === "string") {
        return new URL(file, base).href;
    }
    throw new TypeError("load: invalid usage. Expected load(baseUrl, file) or load(resolverFn, file)");
};

async function loadFile(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to load resource: ${url} (${res.status} ${res.statusText})`);
    }
    return res.text();
}

/**
 * Load one of more files in parallel.
 *
 * Each item can be:
 *   - A string  → file path → raw text returned.
 *   - An object → {file, as} → transformed text returned.
 *
 * @param {string|Function} baseUrl - Calling module URL
 * @param {...(string|{file:string,as?:Function})} files - Strings or typed load descriptors
 * @returns {Promise<Array<any[]>>} - Loaded text or transformed values, in order
 */
export async function load (base, ...files) {
    return Promise.all(files.map(async file => {
        // string, assume file path
        if (typeof file === "string") {
            const url = getUrl(base, file);
            return loadFile(url);
        }
        // Object: decoder
        if (file && typeof file === "object" && 
            typeof file.file === "string") {
                
            const url = getUrl(base, file.file);
            const text = await loadFile(url);
            return typeof file.as === "function"
                ? file.as(text)
                : text;  // fallback to raw text
        }
        throw new TypeError(
            "load: Invalid item. Must be a string or { file: string, as: function }"
        );
    }));
}
