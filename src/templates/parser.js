/**
 * @module parser - Template parser and processor
 */

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { ENSO_NODE, ENSO_PARSED, ENSO_ROOT } from "../core/symbols.js";

import { registerCoreParsers } from './parsers/parsers.js';
import { Action, compileValue, Effect } from "../core/effects.js";
import { EnsoFragment } from "../core/fragment.js";
import { 
    addBinding, addWatcher, 
    parseSource, collectBindings 
} from "./parsers/utils.js";
import { ensoError } from "../core/errors.js";


const createRegistry = () => {
    const map = new Map();
    return {
        get(node, attribute = null) {
            for (const parser of map.values()) {
                if (parser.match(node, attribute)) return parser;
            }
            return null;
        }, 
        set(parser) {
            map.set(parser.type, parser);
        },
        [Symbol.iterator]() {
            return map.values();
        }    
    }
};

export const parser = (() => {

    const parsers = {
        generator: createRegistry(),
        attribute: createRegistry(),
        content: createRegistry(),
    }

    return Object.freeze({

        /**
         * Adds a parser to the parser registry
         * @param {object} parser 
         * @param {string} type 
         */
        register(parser, type = "attribute") {
            const registry = parsers[type];
            if (!registry) ensoError("E_PARSER_TYPE", type);

            registry.set(parser);
        },

        get(type, node, attribute=null) {
            const registry = parsers[type];
            if (!registry) ensoError("E_PARSER_TYPE", type);
            
            return registry.get(node, attribute);
        },
        /**
         * Tags a node as the root of an enso template/fragment
         * @param {HTMLElement} element - Root node
         */
        markRoot(element) {
            element.setAttribute(ENSO_ROOT, "");
        },

        /**
         * Gets the first child element tagged as a root
         * @param {HTMLElement/DocumentFragment} root 
         * @returns 
         */
        getRoot(root) {
            return root.querySelector(`[${ENSO_ROOT}]:not([${ENSO_ROOT}="COMPONENT"])`);
        },

        /**
         * Returns whether the nodes beneath root have been parsed already.
         * @param {HTMLElement} element - Element
         * @returns {Boolean} 
         */
        isParsed(element) {
            return element.hasAttribute(ENSO_PARSED);
        },

        /**
         * Returns first child element tagged as watched from given root
         * @param {HTMLElement || DocumentFragment} root - Root element
         */
        getWatched(root) {
            return root.querySelector(`[${ENSO_NODE}]`);
        },

        /**
         * Preprocesses the given node
         * @param {Object} def      - Node mutation definition
         * @param {Node} node       - The current template node
         * @returns {Boolean} - True if node was processed, otherwise false
         */
        preprocess(def, node) {
            let parsed = false;
            const opParser = parsers.generator.get(node);
            if (opParser) {
                parsed = opParser.preprocess(def, node);
            }

            for (const parser of parsers.content) {
                if (parser.match(node)) {
                    /* v8 ignore next */
                    parsed = parser.preprocess(def, node) || parsed;
                }
            }

            if (node.attributes?.length) {
                const attributes = [...node.attributes];
                for (const attribute of attributes) {
                    const parser = parsers.attribute.get(node, attribute);
                    if (parser) {
                        parsed = parser.preprocess(def, node, attribute) || parsed;
                    }
                }
            }
            return parsed;
        },

        /**
         * Processes a HTML element attached to a component instance based
         * on a mutation definition.
         * @param {Object} def          - Node mutation definition
         * @param {Enso} parent         - Host component or fragment instance
         * @param {HTMLElement} element - Current mutated element
         */
        process(def, parent, element) {
            // Apply operator parser first
            const generator = def.getGenerator();
            if (generator) {
                generator.parser.process(generator.data, parent, element);
            }
            // Loop through all the mutators attached to this node
            for (const [parser, data] of def.mutators()) {
                // Process the live node and attach any mutation effects
                parser.process(data, parent, element);
            }
            element.removeAttribute(ENSO_NODE);
        }
    });
})();

export const ctx = Object.freeze({
    Effect, Action, compileValue,
    addBinding, addWatcher,
    parseSource, collectBindings,
    EnsoFragment,
});

export const register = {
    generator(plugin) {
        parser.register(plugin, 'generator');
    },
    attribute(plugin) {
        parser.register(plugin, 'attribute');
    },
    content(plugin) {
        parser.register(plugin, 'content');
    }
};

registerCoreParsers(register, ctx);
