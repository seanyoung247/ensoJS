
import EnsoStylesheet from "./stylesheets.js";
import EnsoTemplate from "./templates.js";

function createHandler(code, context) {
    const func = new Function(`return ${code}`);
    return func.call(context);
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

    /*
     * Type properties
     */

    /**
     * Defines a new Enso component and registers it in the browser as a custom element.
     * @param {Object} properties                    - Component properties
     *  @param {String} properties.tagName           - DOM tag name for this component
     *  @param {String|EnsoTemplate} properties.template - Template defining component HTML
     *  @param {String|EnsoStylesheet} [properties.styles] - (Optional) Adoptable Style sheet
     *  @param {Object} [properties.attributes]      - (optional) This component's watched attributes
     *  @param {Boolean} [properties.useShadow=true] - (Optional) Should the component use shadow dom 
     * @param {typeof Enso} [component]              - (Optional) Enso derived class implementation
     * @static
     */
    static component({tagName, template, styles=null, attributes=null, useShadow=true}, component=class extends Enso {}) {
        // Ensure that the component attributes are valid
        for (const attr in attributes) {
            const type = attributes[attr].type;
            if (!validAtributeTypes.includes(type)) {
                throw new Error(`Component attribute '${attr}' has unsupported type`);
            }
        }

        if (typeof template === 'string') template = new EnsoTemplate(template);
        if (typeof styles === 'string') styles = new EnsoStylesheet(styles);

        // Type properties
        Object.defineProperties(component, {
            '_attributes': { value: attributes, writable: false },
            '_useShadow': { value: useShadow, writable: false },
            '_template': { value: template, writable: false },
            '_styles': { value: styles, writable: false }
        });
        // Instance accessors for static properties
        Object.defineProperties(component.prototype, {
            'attributes': { get() { return this.constructor._attributes; } },
            'useShadow': { get() { return this.constructor._useShadow; } },
            'template': { get() { return this.constructor._template; } },
            'styles': { get() { return this.constructor._styles; } }
        });

        // Define the custom element
        customElements.define(tagName, component);
    }

    /*
     * Instance Properties
     */

    #events = new AbortController();
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

        // Determine what this component's root node should be
        this.#root = this.useShadow ? this.attachShadow(properties) : this;
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

        // console.log(this.template);
        if (this.template) {
            const {DOM, nodes} = this.template.clone();
            for (const node of nodes) {
                // Collect references
                if (node.ref) {
                    this.#refs[node.ref] = node.element;
                }
                // Attach event listeners
                if (node.events.length) {
                    for (const event of node.events) {
                        const handler = createHandler(event.value, this);
                        node.element.addEventListener(
                            event.name, handler, 
                            { signal: this.#events.signal }
                        );
                    }
                }
                // Register bindings
            }
            this.#root.append(DOM);
        }

        if (this.styles) {
            this.styles.attach(this.#root);
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
        const val = this.attributes[property].type != Boolean ? 
            this.attributes[property].type(newValue) :
            this.hasAttribute(property);
        // Reflect change to component properties
        if (this[property] != val) this[property] = val;
    }

}
