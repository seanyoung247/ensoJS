
/*!
 * Enso v1.0.0
 * Copyright (c) 2025 Sean Young
 * Licensed under the MIT License
 */

import EnsoComponent from "./component.js";
import { createComponent } from "./core/components.js";
import { parseScript } from "./core/watched.js";
import { Watched } from "./core/watched.js";

const Enso = (()=>{
    const defaultSettings = (overrides = {}) => ({
        useShadow: true,
        shadowMode: "open",

        ...overrides
    });
        
    return Object.seal({
        version: '0.9.5',

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
         * 
         * @example
         * const MyCounter = Enso.component('my-counter', {
         *   watched: { count: 0 },
         *   template: html`<button @click="this.increment">{{ watched:count }}</button>`,
         *   script: {
         *     increment() { this.watched.count++; }
         *   }
         * });
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

            const watchers = parseScript(script);
            const component = createComponent(EnsoComponent, script);

            // Create observed and watched properties
            const WatchedClass = Watched.define(watched, watchers);
            
            if (styles && !Array.isArray(styles)) styles = [styles];
            // Static properties
            Object.defineProperties(component, {
                'observedAttributes': { get() { return WatchedClass.attr; } },
                'WatchedClass': { get() { return WatchedClass; } }
            });
            // Type properties
            Object.defineProperties(component.prototype, {
                'observedAttributes': { get() { return WatchedClass.attr; } },
                'settings': { get() { return settings; } },
                'template': { get() { return template; } },
                'styles': { get() { return styles; } },
                'expose': { get() { return expose; } },
            });

            // Define the custom element
            customElements.define(tag, component);
            return component;
        }
    });
})();

//// EXPORTS

// Resource loaders
export { load } from './utils/loaders.js';
// Template tags
export { css, html } from './core/tags.js';
// Template helpers
export * from './utils/helpers.js';
// Watched properties
export { 
    prop, attr, watches, 
    getWatched, setWatched 
} from './core/watched.js';
// Component creator and global settings
export default Enso;
