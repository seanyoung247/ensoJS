
/*!
 * Enso v1.0.0
 * Copyright (c) 2025 Sean Young
 * Licensed under the MIT License
 */

import { createEffectEnv } from "./core/effects.js";
import { attachStyleSheets } from "./utils/css.js";
import { markChanged, update } from "./core/components.js";
import { 
    ENV, ROOT, TASK_LIST,
    UPDATE, MARK_CHANGED, GET_BINDING, 
    SCHEDULE_UPDATE, SCHEDULE_EFFECT,
    ATTACH_TEMPLATE, ADD_CHILD, 
    BINDINGS, CHILDREN, ENSO_INTERNAL,
} from "./core/symbols.js";

/**
 * Enso Web Component base class
 * @abstract
 */
export default class EnsoComponent extends HTMLElement {
    //// Instance Fields
    #initialised = false;
    // Root element -> either this, or shadowroot
    #root = null;
    // Reactivity properties
    #updateScheduled = false;
    #taskList = new Set();
    #bindings = new Map();
    #children = [];
    #watched;
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

        this.#watched = new this.constructor.WatchedClass(this);
        for (const prop in this.#watched.defs) {
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
    get watched() { return this.#watched; }

    //// Accessors - Framework internal
    get [TASK_LIST]() { return this.#taskList; }
    get [BINDINGS]() { return this.#bindings; }
    get [CHILDREN]() { return this.#children; }
    get [ROOT]() { return this.#root; }
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
            if (this.watched.defs[attr].attribute.force) {
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
        const val = this.watched.defs[property].attribute.toProp(newValue);
        if (this.watched[property] !== val) this.watched[property] = val;
    }

    //// Lifecycle
    [ATTACH_TEMPLATE](DOM) { 
        this[ROOT].append(DOM);
        this.onStart();
    }

    reflectAttribute(attribute) {
        const attr = this.#watched.defs[attribute];
        const value = attr.attribute.toAttr(this.watched[attribute]);
        
        if (value !== this.getAttribute(attribute.name)) {
            if (value === null) this.removeAttribute(attribute.name);
            else this.setAttribute(attribute.name, value);
        }
    }

    [SCHEDULE_UPDATE]() {
        if (!this.#updateScheduled) {
            this.#updateScheduled = true;
            requestAnimationFrame(this[UPDATE]);
        }
    }

    [MARK_CHANGED](prop) {
        markChanged(this, prop); 
    }

    [UPDATE]() {
        this.preUpdate();
        this.#updateScheduled = false;

        update(this);

        this.postUpdate();
    }
}
