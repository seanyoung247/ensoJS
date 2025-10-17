
/*!
 * Enso v1.0.0
 * Copyright (c) 2025 Sean Young
 * Licensed under the MIT License
 */

import { createEffectEnv } from "./core/effects.js";
import { attachStyleSheets } from "./utils/css.js";

import { 
    defineWatchedProperty, createComponent, markChanged, update 
} from "./core/components.js";

import { 
    ENV, ROOT, TASK_LIST,
    UPDATE, MARK_CHANGED, GET_BINDING, 
    SCHEDULE_UPDATE, SCHEDULE_EFFECT,
    ATTACH_TEMPLATE, ADD_CHILD, 
    BINDINGS, CHILDREN, ENSO_INTERNAL,
} from "./core/symbols.js";


const defaultSettings = (overrides = {}) => ({
    useShadow: true,
    shadowMode: "open",

    ...overrides
});

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
     *  @param {Object} [props.script]          - (Optional) Custom component code implementation
     *  @param {EnsoSettings} [props.settings]  - (Optional) Settings object
     * @returns {typeof Enso} - The newly constructed component class
     * @static
     */
    static component(tag, {
            template,
            styles=null, 
            expose={},
            properties={},
            script=null,
            settings={}
        }) { settings = defaultSettings(settings);

        const component = createComponent(Enso, script);

        // Create observed properties
        const observedAttributes = [];
        for (const prop in properties) {
            properties[prop] = defineWatchedProperty(component, prop, properties[prop]);
            if (properties[prop].attribute) observedAttributes.push(prop);
        }

        if (styles && !Array.isArray(styles)) styles = [styles];

        // Type properties
        Object.defineProperties(component.prototype, {
            'observedAttributes': { get() { return observedAttributes; } },
            'properties': { get() { return properties; } },
            'settings': { get() { return settings; } },
            'template': { get() { return template; } },
            'styles': { get() { return styles; } },
            'expose': { get() { return expose; } },
            // 'tag': { get() { return tag; } }
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
    #taskList = new Set();
    #bindings = new Map();
    #children = [];
    #refs = {};
    #env = createEffectEnv(this.expose);

    //// Setup
    #getShadowDom() {
        return (this.shadowRoot ?? this.attachShadow({ mode: this.settings.shadowMode }));
    }

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
        
        this.#root = this.settings.useShadow ? this.#getShadowDom() : this;
    }

    //// Accessors - External
    get refs() { return this.#refs; }
    get component() { return this; }
    get isAttached() { return this.#initialised; }

    //// Accessors - Framework internal
    get [TASK_LIST]() { return this.#taskList; }
    get [BINDINGS]() { return this.#bindings; }
    get [CHILDREN]() { return this.#children; }
    get [ROOT]() { console.log('Root', this.#root); return this.#root; }
    get [ENV]() { return this.#env; }

    [SCHEDULE_EFFECT](effect) {
        this.#taskList.add(effect);
    }

    [GET_BINDING](bind) { return this.#bindings.get(bind); }

    [ADD_CHILD](fragment) {
        this.#children.push(fragment);
    }

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

    /**
     * Called before the component updates the DOM in response to property changes.
     * @abstract
     */
    preUpdate() {}
    /**
     * Called after the component updates the DOM in response to property changes.
     * @abstract
     */
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
        const attributes = this.observedAttributes;
        for (const attr of attributes) {
            if (this.properties[attr].attribute.force) {
                this.reflectAttribute(attr);
            }
        }

        // Parse and attach template
        this[ATTACH_TEMPLATE](
            this.template.process(this, this.template)
        );

        if (this.styles) {
            attachStyleSheets(this[ROOT], this.styles);
        }

        this.#initialised = true;
        // Initial render
        this[UPDATE]();
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
    [ATTACH_TEMPLATE](DOM) { 
        this[ROOT].append(DOM);
        this.onStart();
    }

    reflectAttribute(attribute) {
        const attr = this.properties[attribute];
        const value = attr.attribute.toAttr(this[attribute]);
        
        if (value !== this.getAttribute(attribute)) {
            if (value === null) this.removeAttribute(attribute);
            else this.setAttribute(attribute, value);
        }
    }

    [SCHEDULE_UPDATE]() {
        if (!this.#updateScheduled) {
            this.#updateScheduled = true;
            requestAnimationFrame(this[UPDATE]);
        }
    }

    [MARK_CHANGED](prop) { markChanged(this, prop); }

    [UPDATE]() {
        this.preUpdate();
        this.#updateScheduled = false;

        update(this);

        this.postUpdate();
    }
}
