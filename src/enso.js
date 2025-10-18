
/*!
 * Enso v1.0.0
 * Copyright (c) 2025 Sean Young
 * Licensed under the MIT License
 */

import EnsoComponent from "./component.js";
import { defineWatchedProperty, createComponent } from "./core/components.js";
const Enso = (()=>{
    const defaultSettings = (overrides = {}) => ({
        useShadow: true,
        shadowMode: "open",

        ...overrides
    });
        
    return {
        version: '0.8.5',

        /**
         * Defines a new Enso component and registers it in the browser as a custom element.
         * @param {String} tag                      - DOM tag name for this component
         * @param {Object} props                    - Component properties
         *  @param {EnsoTemplate} props.template    - Template defining component HTML
         *  @param {EnsoStylesheet|[]} [props.styles] - (Optional) Adoptable Style sheet(s)
         *  @param {Object} [props.expose]          - (optional) Objects to expose to template expressions
         *  @param {Object} [props.watched]         - (optional) This component's watched properties
         *  @param {Object} [props.script]          - (Optional) Custom component code implementation
         *  @param {EnsoSettings} [props.settings]  - (Optional) Settings object
         * @returns {typeof Enso} - The newly constructed component class
         * @static
         */
        component(tag, {
                template,
                styles=null, 
                expose={},
                watched={},
                script=null,
                settings={}
            }) { settings = defaultSettings(settings);

            const component = createComponent(EnsoComponent, script);

            // Create observed properties
            const observedAttributes = [];
            for (const prop in watched) {
                watched[prop] = defineWatchedProperty(component, prop, watched[prop]);
                if (watched[prop].attribute) observedAttributes.push(prop);
            }

            if (styles && !Array.isArray(styles)) styles = [styles];

            // Type properties
            Object.defineProperties(component.prototype, {
                'observedAttributes': { get() { return observedAttributes; } },
                'settings': { get() { return settings; } },
                'template': { get() { return template; } },
                'watched': { get() { return watched; } },
                'styles': { get() { return styles; } },
                'expose': { get() { return expose; } },
            });

            // Define the custom element
            customElements.define(tag, component);
            return component;
        }
    };
})();

//// EXPORTS

// Resource loaders
export { load } from './utils/loaders.js';
// Template tags
export { css, html } from './core/tags.js';
// Template helpers
export * from './utils/helpers.js';
export default Enso;
