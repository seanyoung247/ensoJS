
import { runEffect, createFunction, createStringTemplate } from "../utils/effects.js";

const noParser = {
    preprocess() { return false; },
    process() { return false; }
};

const ENSO_NODE = 'data-enso-node';  // Watched node identifier and definition index

/**
 * Creates a new mutation definition for a node
 * @param {Number} index - The next available index in the mutation list
 * @returns {Object} - Mutation definition
 */
export const createNodeDef = index => ({
    index,          // Index in the node list
    ref: null,      // Name to use for element reference or null (no reference)
    events: null,   // List of event handlers
    attrs: null,    // Attribute mutations
    content: null,  // Content mutations
    parsers: [],    // List of required parsers
});

export const parser = (() => {
    const parsers = new Map();

    return {
        /**
         * Register a new template parser
         * @param {String} id       - String identfier for the parser
         * @param {Object} parser   - Parser code implementation
         */
        register(id, parser) {
            parsers.set(id, parser);
        },

        /**
         * Returns a Parser identified by the id
         * @param {String} id       - String identifier for the parser
         * @returns {Object}        - The parser requested
         */
        getParser(id) {
            return (parsers.get(id) ?? noParser);
        },

        /**
         * Returns the node definition index for the given
         * mutated element.
         * @param {HTMLElement} element - Watched element
         * @returns {Number}            - The index of the elements node definition
         */
        getNodeIndex(element) {
            return parseInt(element.getAttribute(ENSO_NODE));
        },

        /**
         * Tags the element as watched and stores it's node 
         * definition index.
         * @param {HTMLElement} element - Watched element
         * @param {Number} index        - Node definition index
         */
        setNodeIndex(node, index) {
            node.setAttribute(ENSO_NODE, index);
        },

        /**
         * Returns all children elements tagged as watched from given root
         * @param {HTMLElement} root - Root element
         */
        getElements(root) {
            return root.querySelectorAll(`[${ENSO_NODE}]`);
        },

        /**
         * Preprocesses the given node and/or attribute
         * @param {Object} def      - Node mutation definition
         * @param {Node} node       - The current template node
         * @param {Attr} attribute  - The current attribute or none
         * @returns {Boolean} - True if node was processed, otherwise false
         */
        preprocess(def, node, attribute=null) {
            const id = attribute ? attribute.name[0] : 'TEXT';
            const parser = this.getParser(id);
            return parser.preprocess(def, node, attribute);
        },

        /**
         * Processes a HTML element attached to a component instance based
         * on a mutation definition.
         * @param {Object} def          - Node mutation definition
         * @param {Enso} component      - Host component instance
         * @param {HTMLElement} element - Current mutated element
         */
        process(def, component, element) {
            // Loop through all the processors attached to this node
            for (const parser of def.parsers) {
                parser.process(def, component, element);
            }
            element.removeAttribute(ENSO_NODE);
        }
    };
})();


const getName = attr => attr.name.slice(1).toLowerCase();
const getBindings = (source, set) => {
    let bind;
    while ((bind = bindEx.exec(source)) !== null) {
        set.add(bind[1]);
    }
};

// Matches object property dependencies, i.e. this.<property>:
const bindEx = RegExp(/(?:this\.)(\w+|\d*)/gi);


// Textnode parser
parser.register('TEXT', {

    createEffect(code) {
        // return createFunction('el', `el.textContent = ${code};`);
        const fn = createFunction(code);
        return function (environment, el) {
            const content = fn.call(this, environment);
            if (content) {
                el.textContent = content;
            }
        };
    },

    preprocess(def, node) {
        const span = document.createElement('span');
        // Indicates that this parser is needed to processes this node
        def.parsers.push(this);
        def.content = {
            effect: this.createEffect(
                createStringTemplate(node.nodeValue)
            ),
            binds: new Set()
        };
        node.parentNode.replaceChild(span, node);

        getBindings(node.nodeValue, def.content.binds);

        return span;
    },

    process(def, component, element) {
        if (def.content) {
            for (const bind of def.content.binds) {
                const binding = component.getBinding(bind);
                if (binding) binding.effects.push({ element, action: def.content.effect });
            }
            // Initial render
            runEffect(def.content.effect, component, element);
        }
    }

});

// Reference Attribute (#ref) parser
parser.register('#', {

    preprocess(def, node, attribute) {
        def.parsers.push(this);
        def.ref = attribute.value;
        node.removeAttribute(attribute.name);

        return false;
    },

    process(def, component, element) {
        if (def.ref) {
            Object.defineProperty(component.refs, def.ref, {
                value: element,
                writable: false,
                configurable: false,
            });
        }
    }

});

// Event Attribute (@<event name>) parser
parser.register('@', {

    createEventHandler(code) {
        return createFunction(`with (environment) {return (function() {"use strict"; return ${code}})}`);
        // return createFunction(`return (${code})`);
    },

    preprocess(def, node, attribute) {
        const event = {
            name: getName(attribute), 
            value: this.createEventHandler(attribute.value)
        };
        def.parsers.push(this);

        if (!def.events) def.events = [ event ];
        else def.events.push( event );
        node.removeAttribute(attribute.name);

        return true;
    },

    process(def, component, element) {
        if (def.events?.length) {
            for (const event of def.events) {
                const handler = event.value.call(component, {}).call(component).bind(component);
                element.addEventListener( event.name, handler );
            }
        }
    }

});

// Attribute binding (:<attribute name>) parser
parser.register(':', {

    createEffect(attr, code) {
        // const fn = createFunction(`return ${code}`);
        const fn = createFunction(code);
        return function (environment, el) {
            const content = fn.call(this, environment);
            if (content) {
                el.setAttribute(attr, (content === true) ? '' : content);
            }
            else {
                el.removeAttribute(attr);
            }
        };
    },

    preprocess(def, node, attribute) {
        const name = getName(attribute);
        const effect = this.createEffect(name, 
            createStringTemplate(attribute.value)
        );
        const attr = {
            name, effect, binds: new Set()
        };
        def.parsers.push(this);

        getBindings(attribute.value, attr.binds);

        if (!def.attrs) def.attrs = [attr];
        else def.attrs.push(attr);

        node.removeAttribute(attribute.name);
        
        return true;
    },

    process(def, component, element) {
        if (def.attrs) {
            for (const attr of def.attrs) {
                for (const bind of attr.binds) {
                    const binding = component.getBinding(bind);
                    if (binding) binding.effects.push({element, action: attr.effect});
                }
                runEffect(attr.effect, component, element);
            }
        }
    }

});

// Property binding (.<property name>) parser
// Command directive (*<command>) parser