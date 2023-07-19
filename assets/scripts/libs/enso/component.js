
import { parser } from "./templates/parsers.js";
import { runEffect, createEffectEnv } from "./utils/effects.js";
import { defineWatchedProperty, createComponent } from "./utils/properties.js";

/**
 * Enso Web Component base class
 * @abstract
 */
export default class Enso extends HTMLElement {

    /**
     * Defines a new Enso component and registers it in the browser as a custom element.
     * @param {String} tag                      - DOM tag name for this component
     * @param {Object} props                    - Component properties
     *  @param {EnsoTemplate} props.template    - Template defining component HTML
     *  @param {EnsoStylesheet} [props.styles]  - (Optional) Adoptable Style sheet
     *  @param {Object} [props.expose]          - (optional) Objects to expose to template expressions
     *  @param {Object} [props.properties]      - (optional) This component's watched properties
     *  @param {Boolean} [props.useShadow=true] - (Optional) Should the component use shadow dom 
     *  @param {Object} [props.component]       - (Optional) Custom component code implementation
     * @static
     */
    static component(tag, 
        {template, styles=null, expose={}, properties={}, useShadow=true, component=null}) {

        component = createComponent(this, component);

        // Create observed properties
        const attributes = [];
        for (const prop in properties) {
            properties[prop] = defineWatchedProperty(component, prop, properties[prop]);
            if (properties[prop].attribute) attributes.push(prop);
        }

        // Type properties
        Object.defineProperty(component, 'observedAttributes', {
            get() { return attributes; }
        });
        Object.defineProperties(component.prototype, {
            'observedAttributes': { get() { return attributes; } },
            'properties': { get() { return properties; } },
            'useShadow': { get() { return useShadow; } },
            'template': { get() { return template; } },
            'styles': { get() { return styles; } },
            'expose': { get() { return expose; } }
        });

        // Define the custom element
        customElements.define(tag, component);
    }

    //// Instance Fields

    #intialised = false;
    // Root element -> either this, or shadowroot
    #root = null;
    // Reactivity properties
    #bindings = new Map();
    #refs = {};
    #env = createEffectEnv(this.expose);

    //// Setup

    constructor() {
        super();

        for (const prop in this.properties) {
            this.#bindings.set(prop, { changed: false, effects: [] });
        }

        this.update = this.update.bind(this);

        this.#root = this.useShadow ? 
            this.shadowRoot ?? this.attachShadow({mode: 'open'}) : this;
    }

    //// Accessors
    get refs() { return this.#refs; }
    get env() { return this.#env; }
    getBinding(bind) { return this.#bindings.get(bind); }


    //// LifeCycle hooks

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
    onPropertyChange() {}

    preUpdate() {}
    postUpdate() {}

    /**
     * Called before the component is removed from the page. Component cleanup
     * should be done here.
     * @abstract
     */
    onRemoved() {}


    //// Web Component API

    connectedCallback() {
        if (this.#intialised) return;

        // Loops through all properties defined as attributes and sets 
        // their initial value if they're forced.
        const attributes = this.observedAttributes;
        for (const attr of attributes) {
            if (this.properties[attr].attribute.force) {
                this.reflectAttribute(attr);
            }
        }

        // Parse and attach template
        const DOM = this.template.clone();
        const watched = this.template.watchedNodes;
        const elements = parser.getElements(DOM);

        for (const element of elements) {
            const idx = parser.getNodeIndex(element);
            parser.process(watched[idx], this, element);
        }
        // Attach to the dom on the next update
        requestAnimationFrame( () => this.#root.append(DOM) );

        if (this.styles) {
            this.styles.adopt(this.#root);
        }

        this.#intialised = true;
        this.onStart();

        requestAnimationFrame(this.update);
    }

    disconnectedCallback() {
        this.onRemoved();
    }
      
    // adoptedCallback() {}

    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) return;

        const val = this.properties[property].attribute.toProp(newValue);
        if (this[property] !== val) this[property] = val;
    }

    //// Lifecycle

    reflectAttribute(attribute) {
        const attr = this.properties[attribute];
        const value = attr.attribute.toAttr(this[attribute]);
        
        if (value !== this.getAttribute(attribute)) {
            if (value === null) this.removeAttribute(attribute);
            else this.setAttribute(attribute, value);
        }
    }

    markChanged(prop) {
        const bind = this.#bindings.get(prop);
        if (bind) {
            bind.changed = true;
        }
    }

    update() {

        for (const bind of this.#bindings.values()) {
            if (bind.changed) {
                for (const effect of bind.effects) {
                    runEffect(effect.action, this, effect.element);
                }
                bind.changed = false;
            }
        }

        requestAnimationFrame(this.update);
    }
}
