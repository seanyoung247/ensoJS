
/**
 * Base class to help create Web Components. 
 * Handles much of the boilerplate needed for web components.
 * @abstract
 */
export default class WebComponent extends HTMLElement {

    /*
     * Type properties
     */

    static _template = null;    // The HTML template for the component's internal DOM
    static _styles = null;      // Internal style sheet
    /**
     * Provides the attributes and their types that this component recognises.
     * eg: {'attribute1': {type:Number,default:0}}
     * @static
     */
    static get _attributes() { return {}; }
    /**
     * Provides the DOM tag name for this component
     * @static
     * @abstract
     * @return {String} - tag name
     */
    static get tagName() {
        throw new Error(`${this.name} has no defined tag name! Have you provided a static get tagName?`);
    }

    /* Instance accessors for static properties */
    get styles() { return this.constructor._styles; }
    get template() { return this.constructor._template; }
    get attributes() { return this.constructor._attributes; }

    /*
     * Instance Properties
     */

    #root = null;   // Stores the shadowRoot in a private variable to avoid exposing it if it is created closed
    #events = [];   // Stores the events attached to child elements so they can be cleaned up automatically

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
        this.#createShadowDOM(properties);
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

    #createShadowDOM(properties={mode:'open'}) {
        this.#root = this.attachShadow(properties);
        
        if (this.template) {
            this.#root.append(this.template.content.cloneNode(true));
        }

        if (this.styles) {
            this.#root.adoptedStyleSheets = [this.styles];
        }
    }

    /*
     * Component internal DOM
     */

    /**
     * Gets an element from the shadow DOM using CSS selectors.
     * If the selector matches multiple elements, the first found
     * is returned.
     * @param {String} selector - The CSS selector to search for.
     * @returns {Element} - The first element matching the CSS selector
     */
    getElement(selector) {
        return this.#root.querySelector(selector);
    }

    /**
     * Gets all elements from the shadow DOM matching the
     * provided CSS selector.
     * @param {String} selector - The CSS selector to search for.
     * @returns {NodeList} - The list of elements matching the CSS selector
     */
    getElements(selector) {
        return this.#root.querySelectorAll(selector);
    }

    /**
     * Attaches an event listener to the element passed. 
     * Event listeners will automatically be cleaned up when the component unmounts. 
     * @param {HTMLElement} element - Element to attach listener to
     * @param {String} event - The event to listen for
     * @param {Function} handler - The event handler function
     * @param {*} options - Event options (optional)
     */
    watchEvent(element, event, handler, options = null) {
        element.addEventListener(event, handler, options);
        this.#events.push({element, event, handler, options});
    }

    /*
     * Lifecycle events
     */

    /**
     * Called when the component has been mounted and started on the page.
     */
    onStart() {}

    /**
     * Called after a property value changes. This allows components
     * to react to property changes without needing to reimplement
     * reflection boilerplate.
     * @param {String} prop - String name of the property
     * @param {*} value - The new property value
     */
    onPropertyChange(prop, value) {}

    /**
     * Called when the component is removed from the page. Component cleanup
     * should be done here.
     */
    onRemoved() {}


    /*
     * Web component API interface
     */
    static get observedAttributes() {
        if (!this._attributes) return [];
        return Object.keys(this._attributes);
    }

    connectedCallback() { this.onStart(); }

    disconnectedCallback() {
        // Remove any registered event listeners
        for (const {element, event, handler, options} of this.#events) {
            element.removeEventListener(event, handler, options);
        }
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
