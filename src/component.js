
/*!
 * Enso v1.0.0
 * Copyright (c) 2025 Sean Young
 * Licensed under the MIT License
 */

import { createEffectEnv } from "./core/effects.js";
import { attachStyleSheets } from "./utils/css.js";
import { EnsoNode } from "./core/components.js";
import { 
    ENV, ROOT, ATTACH_TEMPLATE, BINDINGS, 
    UPDATE, SCHEDULE_UPDATE, ENSO_INTERNAL,
} from "./core/symbols.js";


export const lifecycle = Object.freeze({
    mount: 'lifecycle:mount',
    update: 'lifecycle:update',
    unmount: 'lifecycle:unmount',
});
export const lifecycles = Object.values(lifecycle);

/**
 * Enso Web Component base class
 * @abstract
 */
export default class EnsoComponent extends EnsoNode(HTMLElement) {
    //// Instance Fields
    #initialised = false;
    // Root element -> either this, or shadowroot
    #root = null;
    // Reactivity properties
    #updateScheduled = false;
    #watched;
    #refs = Object.create(null);
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
        this[BINDINGS]= this.#watched[BINDINGS];
        
        this.#root = this.settings.useShadow ? this.#getShadowDom() : this;
    }

    //// Accessors - External
    get refs() { return this.#refs; }
    get component() { return this; }
    get isAttached() { return this.#initialised; }
    get watched() { return this.#watched; }

    //// Accessors - Framework internal
    get [ROOT]() { return this.#root; }
    get [ENV]() { return this.#env; }

    //// Web Component API

    connectedCallback() {
        if (this.#initialised) return;
        this.#initialised = true;

        // Loops through all properties defined as attributes 
        // and sets their initial value if they're forced.
        const attributes = this.observedAttributes;
        for (const attr of attributes) {
            if (this.watched._defs[attr].attribute.force) {
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

        // Initial render
        this[UPDATE]();
    }

    disconnectedCallback() {
        this.#watched._notify(lifecycle.unmount);
    }
      
    // adoptedCallback() {} -- Not Yet Supported

    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) return;
        const val = this.watched._defs[property].attribute.toProp(newValue);
        if (this.watched[property] !== val) this.watched[property] = val;
    }

    //// Lifecycle
    [ATTACH_TEMPLATE](DOM) { 
        this[ROOT].append(DOM);
        this.#watched._notify(lifecycle.mount);
    }

    reflectAttribute(attribute) {
        const attr = this.#watched._defs[attribute];
        const value = attr.attribute.toAttr(this.watched[attribute]);
        
        if (value !== this.getAttribute(attr.name)) {
            if (value === null) this.removeAttribute(attr.name);
            else this.setAttribute(attr.name, value);
        }
    }

    [SCHEDULE_UPDATE]() {
        if (!this.#updateScheduled) {
            this.#updateScheduled = true;
            requestAnimationFrame(this[UPDATE]);
        }
    }

    [UPDATE]() {
        this.#updateScheduled = false;

        super[UPDATE]();

        this.#watched._notify(lifecycle.update);
    }
}
