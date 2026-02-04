
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import EnsoComponent from "../component.js";
import { createComponent } from "./components.js";
import { createComponentTag } from "./tags.js";
import { parseScript } from "./watched.js";
import { Watched } from "./watched.js";
import { VERSION } from "../../version.js";

import { setErrorResolver, ensoError } from "./errors.js";

import { register, ctx } from "../templates/parser.js";

const defaultSettings = (overrides = {}) => ({
    useShadow: true,
    shadowMode: "open",

    ...overrides
});

let diagnosticsEnabled = false;
let resolverPromise = null;
const errorString = (code, data) => `${code}: ${data}`;

export const API = {
    version: VERSION,

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
     * @returns {import('../types/api').ComponentTag} - A tag function for use in component templates
     * 
     * @example
     * const MyCounter = Enso.component('my-counter', {
     *   watched: { count: 0 },
     *   template: html`<button @click="this.increment">{{ watched:count }}</button>`,
     *   script: {
     *     increment() { this.count++; }
     *   }
     * });
     */
    component(tag, {
            template,
            styles=null, 
            expose={},
            watched={},
            script=null,
            settings={}
        }) { settings = defaultSettings(settings);

        if (customElements.get(tag)) ensoError(101, tag); // E_COMPONENT_DEF

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
            'settings': { get() { return settings; } },
            'template': { get() { return template; } },
            'styles': { get() { return styles; } },
            'expose': { get() { return expose; } },
        });

        // Define the custom element
        customElements.define(tag, component);
        /** @type {import('../types/api').ComponentTag} */
        return createComponentTag(tag, component);
    },

    /**
     * Adds a custom template parser.
     * @param {(register, ctx)=>void} plugin - Custom parser registration function
     */
    use(plugin) {
        plugin(register, ctx);
    },

    /**
     * Enables verbose diagnostic mode.
     * @async
     */
    async enableDiagnostics() {
        diagnosticsEnabled = true;

        // Cache the import so it only happens once
        resolverPromise ||= import('../errors/index.js');

        const { default: resolver } = await resolverPromise;

        // Guard against disable happening while loading
        if (diagnosticsEnabled) {
            setErrorResolver(resolver);
        }
    },
    /**
     * Disables verbose diagnostic mode
     */
    disableDiagnostics() {
        diagnosticsEnabled = false;
        setErrorResolver(errorString); // minimal fallback
    }
};
