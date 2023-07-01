
import EnsoStylesheet from "./templates/stylesheets.js";
import EnsoTemplate, { ENSO_ATTR, ENSO_BIND } from "./templates/templates.js";
import { defineTypeConstants, defineAttribute } from "./utils/components.js";

function createHandler(code, context) {
    const func = new Function(`return ${code}`);
    return func.call(context).bind(context);
}

function createBoundValue(code, context) {
    const func = new Function(`return ${code}`);
    return func.bind(context);
}

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
     *  @param {Boolean} [props.useShadow=true]      - (Optional) Should the component use shadow dom 
     * @param {Enso} [component]                     - (Optional) Enso derived class implementation
     * @static
     */
    static component({tag, template, 
        styles=null, attributes={}, useShadow=true}, 
        component=class extends Enso {}) {

        // Create observed attributes
        for (const attr in attributes) {
            attributes[attr] = defineAttribute(component, attr, attributes[attr]);
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
    
    // Root element, either this, or shadowroot
    #root = null;
    #rootProps = null;

    // Reactivity properties
    #refs = {};
    #bindings = new Map();
    #events = new AbortController();

    constructor(properties={mode:'open'}) {
        super();
        this.#rootProps = properties;
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
        this.#root = this.useShadow ? this.attachShadow(this.#rootProps) : this;

        requestAnimationFrame(this.render.bind(this));
        // Ensure any persistent attributes are shown
        for (const attr in this.attributes) {
            const properties = this.attributes[attr];
            if (properties.force) {
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
                                    element.textContent = content();
                                }
                            });
                        }
                    }
                    element.removeAttribute(ENSO_BIND);
                    // Initial render
                    element.textContent = content();
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
        if (oldValue !== newValue) this.setAttribute(property, newValue);
    }

    /* PROOF OF CONCEPT - Defer attribute setting until repaint */
    reflectAttribute(attribute) {
        const attr = this.attributes[attribute];
        const value = attr.convert.toAttr(this[attribute]);
        if (value === null) super.removeAttribute(attribute);
        else {
            super.setAttribute(attribute, value);
        }
    }

    getAttribute(attribute) {
        return this.attributes[attribute].convert.toAttr(this[attribute]);
    }

    setAttribute(attribute, value) {
        const val = this.attributes[attribute].convert.toProp(value);
        if (this[attribute] !== val) this[attribute] = val;
    }

    removeAttribute(attribute) {
        this[attribute] = null;
    }

    hasAttribute(attribute) {
        return this[attribute] !== null;
    }
    
    render() {
        for (const attr in this.attributes) {
            if (true) { // ToDo: Dirty check here
                this.reflectAttribute(attr);
            }
        }
        requestAnimationFrame(this.render.bind(this));
    }
}
