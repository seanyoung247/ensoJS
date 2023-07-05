
import EnsoStylesheet from "./templates/stylesheets.js";
import EnsoTemplate, { ENSO_NODE } from "./templates/templates.js";
import { defineWatchedProperty } from "./utils/components.js";

function createHandler(code, context) {
    const func = new Function(`return ${code}`);
    return func.call(context).bind(context);
}

function createBoundValue(code, context) {
    const func = new Function(`return ${code}`);
    return func.bind(context);
}

function createTextBinding(code, context) {
    const func = new Function('el', `el.textContent = ${code};`);
    return func.bind(context);
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
    #refs = {};
    #bindings = new Map();
    #events = new AbortController();

    constructor() {
        super();

        for (const prop in this.properties) {
            this.#bindings.set(prop, { changed: false, nodes: new Set() });
        }

        this.#root = this.useShadow ? 
            this.shadowRoot ?? this.attachShadow({mode:'open'}) : this;
    }

    get refs() { return this.#refs; }

    markChanged(prop) {
        this.#bindings.get(prop).changed = true;
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

        requestAnimationFrame(this.render.bind(this));
        // Ensure any forced attributes are shown
        for (const attr in this.attributes) {
            const attribute = this.attributes[attr];
            if (attribute.force) {
                this.setAttribute(attr, this[attr]);
            }
        }

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
                    const content = createTextBinding(node.content, this);

                    for (const bind of node.binds) {
                        if (this.#bindings.has(bind)) {
                            const binding = this.#bindings.get(bind);
                            binding.nodes.add(element);
                            binding.effect = content;
                        }
                    }
                    // Initial render
                    content(element);
                }

                element.removeAttribute(ENSO_NODE);
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

    // Attributes
    reflectAttribute(attribute) {
        const attr = this.properties[attribute];
        const value = attr.attribute.toAttr(this[attribute]);
        
        if (value === null) super.removeAttribute(attribute);
        else super.setAttribute(attribute, value);
    }

    getAttribute(attribute) {
        return this.properties[attribute].attribute.toAttr(this[attribute]);
    }

    setAttribute(attribute, value) {
        const val = this.properties[attribute].attribute.toProp(value);
        if (this[attribute] !== val) this[attribute] = val;
    }

    removeAttribute(attribute) {
        this[attribute] = null;
    }

    hasAttribute(attribute) {
        return this[attribute] !== null;
    }
    
    render() {
        for (const attr in this.properties) {
            
            const val = this.properties[attr].type === Boolean ? 
                super.hasAttribute(attr) :
                this.properties[attr].attribute.toProp(super.getAttribute(attr));

            if (val !== this[attr]) {
                this.reflectAttribute(attr);
            }
        }

        requestAnimationFrame(this.render.bind(this));
    }
}
