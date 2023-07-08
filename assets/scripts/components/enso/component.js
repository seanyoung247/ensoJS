
import EnsoStylesheet from "./templates/stylesheets.js";
import EnsoTemplate, { ENSO_NODE } from "./templates/templates.js";
import { defineWatchedProperty } from "./utils/properties.js";


function createHandler(code, context) {
    const func = new Function(`return ${code}`);
    return func.call(context).bind(context);
}

function createEffect(field, code) {
    const func = new Function('el', `el.${field} = ${code};`);
    return func;
}


/**
 * Enso Web Component base class
 * @abstract
 */
export default class Enso extends HTMLElement {

    /**
     * Defines a new Enso component and registers it in the browser as a custom element.
     * @param {Object} props                          - Component properties
     *  @param {String} props.tag                     - DOM tag name for this component
     *  @param {String|EnsoTemplate} props.template   - Template defining component HTML
     *  @param {String|EnsoStylesheet} [props.styles] - (Optional) Adoptable Style sheet
     *  @param {Object} [props.properties]            - (optional) This component's properties
     *  @param {Boolean} [props.useShadow=true]       - (Optional) Should the component use shadow dom 
     * @param {Enso} [component]                      - (Optional) Enso derived class implementation
     * @static
     */
    static component({tag, template, 
        styles=null, properties={}, useShadow=true}, 
        component=class extends Enso {}) {

        // Create observed properties
        const attributes = [];
        for (const prop in properties) {
            properties[prop] = defineWatchedProperty(component, prop, properties[prop]);
            if (properties[prop].attribute) attributes.push(prop);
        }
        
        if (typeof template === 'string') template = new EnsoTemplate(template);
        if (typeof styles === 'string') styles = new EnsoStylesheet(styles);

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
        });

        // Define the custom element
        customElements.define(tag, component);
    }
    
    // Root element -> either this, or shadowroot
    #root = null;
    // Reactivity properties
    #bindings = new Map();

    refs = {};

    constructor() {
        super();

        for (const prop in this.properties) {
            this.#bindings.set(prop, { changed: false, effects: [] });
        }

        this.update = this.update.bind(this);

        this.#root = this.useShadow ? 
            this.shadowRoot ?? this.attachShadow({mode:'open'}) : this;
    }

    markChanged(prop) {
        const bind = this.#bindings.get(prop);
        if (bind) {
            bind.changed = true;
        }
    }

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
    connectedCallback() {

        // Loops through all properties defined as attributes and sets 
        // their initial value if they're forced.
        const attributes = this.observedAttributes;
        for (const attr of attributes) {
            if (this.properties[attr].attribute.force) {
                this.reflectAttribute(attr);
            }
        }

        requestAnimationFrame(this.update);
        // Parse and attach template
        if (this.template) {
            const DOM = this.template.clone();
            const watched = this.template.watchedNodes;
            const elements = DOM.querySelectorAll(`[${ENSO_NODE}]`);

            // Iterate over watched nodes
            for (const element of elements) {
                const idx = parseInt(element.getAttribute(ENSO_NODE));
                const node = watched[idx];

                // TODO: MAKE THESE DIRECTIVES GENERAL!

                // Collect references
                if (node.ref) this.refs[node.ref] = element;
                // Attach events
                if (node.events?.length) {
                    for (const event of node.events) {
                        const handler = createHandler(event.value, this);
                        element.addEventListener( event.name, handler );
                    }
                }
                // Evaluate data bindings
                if (node.content) {
                    const action = createEffect('textContent', node.content);

                    for (const bind of node.binds) {
                        if (this.#bindings.has(bind)) {
                            const binding = this.#bindings.get(bind);
                            binding.effects.push({ element, action });
                        }
                    }
                    // Initial render
                    action.call(this, element);
                }

                element.removeAttribute(ENSO_NODE);
            }
            // Attach to the dom on the next update
            requestAnimationFrame( () => this.#root.append(DOM) );
        }

        if (this.styles) {
            this.styles.adopt(this.#root);
        }

        this.onStart();
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

    reflectAttribute(attribute) {
        // We don't care about unobserved attributes
        if (!attribute in this.observedAttributes) return;

        const attr = this.properties[attribute];
        const value = attr.attribute.toAttr(this[attribute]);
        
        if (value !== this.getAttribute(attribute)) {
            if (value === null) this.removeAttribute(attribute);
            else this.setAttribute(attribute, value);
        }
    }

    update() {

        for (const bind of this.#bindings.values()) {
            if (bind.changed) {
                for (const effect of bind.effects) {
                    effect.action && effect.action.call(this, effect.element);
                }
                bind.changed = false;
            }
        }

        requestAnimationFrame(this.update);
    }
}
