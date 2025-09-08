
import { parser } from "./templates/parser.js";
import { runEffect, createEffectEnv } from "./core/effects.js";
import { defineWatchedProperty, createComponent } from "./core/components.js";
import { attachStyleSheets } from "./utils/css.js";

import { 
    UPDATE, MARK_CHANGED, GET_BINDING, 
    TEMPLATES, ENV,
    ENSO_INTERNAL 
} from "./core/symbols.js";

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
     *  @param {EnsoStylesheet|[]} [props.styles] - (Optional) Adoptable Style sheet(s)
     *  @param {Object} [props.expose]          - (optional) Objects to expose to template expressions
     *  @param {Object} [props.properties]      - (optional) This component's watched properties
     *  @param {Boolean} [props.useShadow=true] - (Optional) Should the component use shadow dom 
     *  @param {Object} [props.component]       - (Optional) Custom component code implementation
     * @returns {typeof Enso} - The newly constructed component class
     * @static
     */
    static component(tag, {
            template,
            styles=null, 
            expose={},
            properties={},
            useShadow=true,
            component=null
        }) {

        component = createComponent(Enso, component);

        // Create observed properties
        const observedAttributes = [];
        for (const prop in properties) {
            properties[prop] = defineWatchedProperty(component, prop, properties[prop]);
            if (properties[prop].attribute) observedAttributes.push(prop);
        }

        if (styles && !Array.isArray(styles)) styles = [styles];

        // Type properties
        Object.defineProperty(component, 'observedAttributes', {
            get() { return observedAttributes; }
        });
        Object.defineProperties(component.prototype, {
            'observedAttributesList': { get() { return observedAttributes; } },
            'properties': { get() { return properties; } },
            'useShadow': { get() { return useShadow; } },
            'template': { get() { return template; } },
            'styles': { get() { return styles; } },
            'expose': { get() { return expose; } }
        });

        // Define the custom element
        customElements.define(tag, component);
        return component;
    }

    //// Instance Fields

    #initialised = false;
    // Root element -> either this, or shadowroot
    #root = null;
    // Reactivity properties
    #updateScheduled = false;
    #bindings = new Map();
    #templates = [];
    #refs = {};
    #env = createEffectEnv(this.expose);

    //// Setup

    constructor(key) {
        super();

        if (key !== ENSO_INTERNAL) {
            throw new Error(
                "Direct subclassing of Enso is not supported.\n" +
                "Use Enso.component() instead."
            );
        }

        for (const prop in this.properties) {
            this.#bindings.set(prop, { changed: false, effects: [] });
        }

        this[UPDATE] = this[UPDATE].bind(this);
        this[MARK_CHANGED] = this[MARK_CHANGED].bind(this);

        this.#root = this.useShadow ? 
            this.shadowRoot ?? this.attachShadow({mode: 'open'}) : this;
    }

    //// Accessors - Framework internal
    [GET_BINDING](bind) { return this.#bindings.get(bind); }
    get [TEMPLATES]() { return this.#templates; }
    get [ENV]() { return this.#env; }
    //// Accessors - External
    get refs() { return this.#refs; }


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
        if (this.#initialised) return;

        // Loops through all properties defined as attributes 
        // and sets their initial value if they're forced.
        const attributes = this.observedAttributesList;
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
            attachStyleSheets(this.#root, this.styles);
        }

        this.#initialised = true;
        this.onStart();
    }

    disconnectedCallback() {
        this.onRemoved();
    }
      
    // adoptedCallback() {} -- Not Yet Supported

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

    [MARK_CHANGED](prop) {
        const bind = this.#bindings.get(prop);
        if (bind) {
            bind.changed = true;
            if (!this.#updateScheduled) {
                this.#updateScheduled = true;
                requestAnimationFrame(this[UPDATE]);
            }
        }
    }

    [UPDATE]() {
        this.#updateScheduled = false;
        for (const bind of this.#bindings.values()) {
            if (bind.changed) {
                for (const effect of bind.effects) {
                    runEffect(effect.action, this, effect.element);
                }
                bind.changed = false;
            }
        }
    }
}
