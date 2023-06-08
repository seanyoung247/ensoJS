
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

    /*
     * Type properties
     */

    static _template = null;    // The HTML template for the component's internal DOM
    static _styles = null;      // Internal style sheet
    /**
     * Provides the attributes and their types that this component recognises.
     * If a derived component has HTML attributes it should override this method
     * and return the attributes in an object litteral, ex:
     *  return: {
     *      'attribute1': {type: Number, default: 0},
     *      'attribute2': {type: String, default: 0}
     *  }
     * 
     * Recognised types are limited to:
     *  Boolean, String, Number
     * @static
     */
    static get _attributes() { return {}; }

    /**
     * Defines a new Enso component
     * @param {Object} properties                   - Component properties
     * @param {String} properties.tagName           - DOM tag name for this component
     * @param {HTMLElement} properties.template     - Template defining component HTML
     * @param {CSSStyleSheet} [properties.styles]   - (Optional) Adoptable Style sheet
     * @param {typeof Enso} [properties.component]  - (Optional) Enso derived class implementation
     * @static
     */
    static define({template, styles=null, component=class extends Enso {}}) {
        // Ensure that the component has valid attributes
        const attributes = component._attributes;
        for (const attr in attributes) {
            const type = attributes[attr].type;
            if (!validAtributeTypes.includes(type)) {
                throw new Error(`Component attribute '${attr}' has unsupported type`);
            }
        }
        // Add template and styles
        component._template = template;
        component._styles = styles;
        // Define the custom element
        customElements.define(tagName, component);
    }

    /* Instance accessors for static properties */
    get styles() { return this.constructor._styles; }
    get template() { return this.constructor._template; }
    get attributes() { return this.constructor._attributes; }

    /*
     * Instance Properties
     */

    // #events = new AbortController();
    #root = null;   // Component root element
    #refs = {};     // Holds the defined references for elements in the component's internal DOM.

    /*
     * Component Setup
     */

    constructor(properties={mode:'open'}) {
        super();

        // If this component has custom attributes
        const attributes = Object.entries(this.attributes);
        for (const [attr, value] of attributes) {
            const propName = `_${attr}`;
            this[propName] = value.default;
            // If the child class hasn't already defined getters and 
            // setters for this property, create them now:
            if (!(attr in this)) {
                this.#createDefaultAccessor(attr, propName, value.type);
            }
        }

        // Create the component internal DOM
        this.#root = this.#createShadowDOM(properties);
    }

    #createDefaultAccessor(attr, prop, type) {
        const reflect = (type === Boolean) ? 
            () => this.setAttribute(attr, '') :
            (val) => this.setAttribute(attr, val);

        Object.defineProperty(this, attr, {
            get() { return this[prop]; },
            set(val) {
                // Set new value
                this[prop] = val;
                // Reflect property change back to attributes
                if (this[prop]) reflect(val);
                else this.removeAttribute(attr);
                // Alert child of property change
                this.onPropertyChange(attr, val);
            }
        });
    }

    #createShadowDOM(properties) {
        const root = this.attachShadow(properties);
        if (this.template) {
            root.append(this.template.content.cloneNode(true));
        }

        if (this.styles) {
            root.adoptedStyleSheets = [this.styles];
        }
        return root;
    }

    #getReferences() {
        const refs = this.#root.querySelectorAll('[ref]');
        for (const ref of refs) {
            const key = ref.getAttribute('ref');
            this.#refs[key] = ref;
        }
    }

    /*
     * Accessors
     */
    get _refs() { return this.#refs; }

    /*
     * Lifecycle events
     */

    /**
     * Called when the component has been mounted and started on the page.
     * @abstract
     */
    onStart() {}

    /**
     * Called after a property value changes. This allows components
     * to react to property changes without needing to reimplement
     * reflection boilerplate.
     * @param {String} prop - String name of the property
     * @param {*} value - The new property value
     * @abstract
     */
    onPropertyChange(prop, value) {}

    /**
     * Called when the component is removed from the page. Component cleanup
     * should be done here.
     * @abstract
     */
    onRemoved() {}

    /*
     * Web component API interface
     */
    static get observedAttributes() {
        if (!this._attributes) return [];
        return Object.keys(this._attributes);
    }

    connectedCallback() {
        // Collect this component's references
        this.#getReferences();
        this.onStart();
    }

    disconnectedCallback() {
        // Remove any registered event listeners
        // this.#events.abort();
        this.onRemoved();
    }
      
    adoptedCallback() {}

    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) return;
        // Attributes are always strings, so decode it to the correct datatype
        const val = this.attributes[property].type != Boolean ? 
            this.attributes[property].type(newValue) :
            this.hasAttribute(property);
        // Reflect change to component properties
        if (this[property] != val) this[property] = val;
    }

}
