
import EnsoStylesheet from "./templates/stylesheets.js";
import EnsoTemplate, { ENSO_ATTR, ENSO_BIND } from "./templates/templates.js";
import { defineTypeConstants, defineAttribute } from "./utils/objects.js";

function createHandler(code, context) {
    const func = new Function(`return ${code}`);
    return func.call(context).bind(context);
}

function createBoundValue(code, context) {
    const func = new Function(`return ${code}`);
    return func.bind(context);
}

export const validAtributeTypes = Object.freeze([
    Boolean, 
    Number,
    String
]);

/**
 * Enso Web Component base class
 * @abstract
 */
export default class Enso extends HTMLElement {

    /**
     * Defines a new Enso component and registers it in the browser as a custom element.
     * @param {Object} props                         - Component properties
     *  @param {String} props.tag                    - DOM tag name for this component
     *  @param {String|EnsoTemplate} props.template  - Template defining component HTML
     *  @param {String|EnsoStylesheet} [props.styles] - (Optional) Adoptable Style sheet
     *  @param {Object} [props.attributes]           - (optional) This component's attributes
     *  @param {Array} [props.watched]               - (optional) This component's watched (reactive) fields
     *  @param {Boolean} [props.useShadow=true]      - (Optional) Should the component use shadow dom 
     * @param {Enso} [component]                     - (Optional) Enso derived class implementation
     * @static
     */
    static component({tag, template, 
        styles=null, attributes={}, watch=[], useShadow=true}, 
        component=class extends Enso {}) {

        // Create observed attributes
        for (const attr in attributes) {
            const {value, type=String} = attributes[attr];
            // Ensure that the attribute has a valid type
            if (!validAtributeTypes.includes(type)) {
                throw new Error(`Component attribute '${attr}' has unsupported type`);
            }
            defineAttribute(component, attr, value, type);
        }
        
        if (typeof template === 'string') template = new EnsoTemplate(template);
        if (typeof styles === 'string') styles = new EnsoStylesheet(styles);

        // Type properties
        defineTypeConstants(component, {
            'attributes': attributes,
            'useShadow': useShadow,
            'template': template,
            'styles': styles,
        });

        // Define the custom element
        customElements.define(tag, component);
    }

    #events = new AbortController();
    #root = null;   // Component root element
    #refs = {};     // Holds the defined references for elements in the component's internal DOM.

    #bindings = new Map();

    constructor(properties={mode:'open'}) {
        super();
        // Determine what this component's root node should be
        this.#root = this.useShadow ? this.attachShadow(properties) : this;
    }

    get refs() { return this.#refs; }

    /**
     * Called after the component has been mounted and started on the page.
     * @abstract
     */
    onStart() {}

    /**
     * Called after a property value changes.
     * @param {String} prop - String name of the property
     * @param {*} value - The new property value
     * @abstract
     */
    onPropertyChange(prop, value) {}

    /**
     * Called before the component is removed from the page. Component cleanup
     * should be done here.
     * @abstract
     */
    onRemoved() {}


    //
    // Web Component API
    //
    static get observedAttributes() {
        return Object.keys(this._attributes);
    }

    connectedCallback() {

        // Ensure any persistent attributes are shown
        for (const attr in this.attributes) {
            const properties = this.attributes[attr];
            if (properties.show && properties.type !== Boolean ) {
                this.setAttribute(attr, this[attr]);
            }
        }

        // Parse and attach template
        if (this.template) {
            const DOM = this.template.clone();
            const watched = this.template.watched;
            const elements = DOM.querySelectorAll(`[${ENSO_ATTR}]`);
            // Iterate over watched nodes
            for (const element of elements) {
                const idx = parseInt(element.getAttribute(ENSO_ATTR));
                const node = watched[idx];

                // TODO: MAKE THESE DIRECTIVES GENERAL!

                // Collect references
                if (node.ref) this.#refs[node.ref] = element;
                // Attach events
                if (node.events.length) {
                    for (const event of node.events) {
                        const handler = createHandler(event.value, this);
                        element.addEventListener( event.name, handler,
                            { signal: this.#events.signal });
                    }
                }
                // Evaluate data bindings
                if (node.content) {
                    const content = createBoundValue(node.content, this);
                    // Pull bound variables out of the tag
                    const bindings = element.getAttribute(ENSO_BIND).split(' ');
                    for (const bind of bindings) {
                        if (!this.#bindings.has(bind)) {
                            this.#bindings.set(bind, [ element ]);
                        } else {
                            const list = this.#bindings.get(bind);
                            if (!list.includes(element)) list.push(element);
                        }
                        const prop = Object.getOwnPropertyDescriptor(
                            this.constructor.prototype, bind);

                        if (prop.set) {
                            const setter = prop.set;
                            Object.defineProperty(this, bind, {
                                configurable: true,
                                enumerable: true,
                                get: prop.get,
                                set: val => {
                                    setter.call(this, val);
                                    element.innerText = content();
                                }
                            });
                        }
                    }
                    element.removeAttribute(ENSO_BIND);
                    // Initial render
                    element.innerText = content();
                }

                element.removeAttribute(ENSO_ATTR);
            }

            this.#root.append(DOM);
        }

        if (this.styles) {
            this.styles.adopt(this.#root);
        }

        this.onStart();
    }

    disconnectedCallback() {
        // Remove any registered event listeners
        this.#events.abort();
        this.onRemoved();
    }
      
    // adoptedCallback() {}

    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) return;
        // Attributes are always strings, so decode it to the correct datatype
        const type = this.attributes[property].type || String;
        const val = type != Boolean ? 
            type(newValue) : this.hasAttribute(property);
        // Reflect change to component properties
        if (this[property] != val) this[property] = val;
    }

}
