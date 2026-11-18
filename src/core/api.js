
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import EnsoComponent, { lifecycle } from "../component.js";
import { createComponent } from "./components.js";
import { Watched, prop, attr, computed, watches, parseScript } from "./watched.js";
import { VERSION } from "../../version.js";
import { setErrorResolver, ensoError } from "./errors.js";
import { register, ctx } from "../templates/parser.js";
import EnsoTemplate from "../templates/template.js";
import { css } from "./tags.js";


const defaultSettings = (overrides = {}) => ({
    useShadow: true,
    shadowMode: "open",

    ...overrides
});

let diagnosticsEnabled = false;
let resolverPromise = null;
const errorString = (code, data) => `${code}: ${data}`;


async function collectSheets(styles, baseURI) {
    const sheets = [];

    for (const style of styles) {
        if ( style.hasAttribute('src') ) {
            // External stylesheet to load
            sheets.push(
                fetch( new URL(style.getAttribute('src'), baseURI) )
                    .then( response => {
                        if (!response.ok) {
                            throw new Error(
                                `Failed to load stylesheet: ${response.status}`
                            );
                        }
                        return response.text();
                    })
                    .then( source => css(source))
            );
        }
        else {
            // Styles declared locally
            sheets.push( css(style.textContent) );
        }
    }

    return Promise.all(sheets);
}

function runSetup(script) {
    const source = script?.textContent ?? '';
    const definition = {};
    const context = {
        watched: value => { definition.watched = value },
        script: value => { definition.script = value; },
        expose: value => { definition.expose = value; },
        settings: value => { definition.settings = value; },
        prop,
        attr,
        computed,
        watches,
        lifecycle
    };

    const evaluate = new Function(
        ...Object.keys(context),
        `"use strict";\n${source}`
    );

    evaluate(...Object.values(context));

    return definition;
}

export const API = {
    version: VERSION,

    /**
     * Defines a new Enso component class.
     * @param {Object} props                    - Component properties
     *  @param {EnsoTemplate} props.template    - Template defining component HTML
     *  @param {EnsoStylesheet|[]} [props.styles] - (Optional) Adoptable Style sheet(s)
     *  @param {Object} [props.expose]          - (optional) Objects to expose to template expressions
     *  @param {Object} [props.watched]         - (optional) This component's watched properties
     *  @param {Object} [props.script]          - (Optional) Custom component code implementation
     *  @param {EnsoSettings} [props.settings]  - (Optional) Settings object
     * @returns {typeof EnsoComponent} - Enso component class
     */
    define({
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
            'settings': { get() { return settings; } },
            'template': { get() { return template; } },
            'styles': { get() { return styles; } },
            'expose': { get() { return expose; } },
        });

        return component;
    },

    /**
     * Registers an Enso component class as a custom element.
     * @param {string} tag                     - DOM tag name for this component
     * @param {typeof EnsoComponent} component - EnsoComponent class to register
     * @returns {import('../types/api').ComponentTag} - A Registered component class
     */
    register(tag, component) {
        const registered = customElements.get(tag);

        if (registered) {
            if (registered === component) {
                return component;
            }
            ensoError(101);
        }

        // Define the custom element
        customElements.define(tag, component);
        component.tagName = tag;

        return component;
    },

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
     * @returns {import('../types/api').ComponentTag} - A Registered component class
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
    component(tag, props) {
        const component = this.define(props);
        return this.register(tag, component);
    },

    /**
     * Defines an Enso component from a html definition and registers it in the browser as a custom element.
     * @param {HTMLTemplateElement} definition - A HTML template element defining the component definition.
     * @returns {Promise<typeof EnsoComponent>} The registered component class.
     */
    async sfc(definition) {
        if (!definition.hasAttribute('enso-component'))
            ensoError(104);

        const tagName = definition.getAttribute('enso-component');
        const sheets = collectSheets(
            definition.content.querySelectorAll('style'),
            definition.baseURI
        );
        const template = new EnsoTemplate(
            definition.content.querySelector('template')
        );
        const fields = runSetup(
            definition.content.querySelector('script[type=enso]')
        );
        const styles = await sheets;

        const component = this.component(tagName, {
            styles,
            template,
            ...fields
        });

        // Remove the definition and if inline replace it with a live version
        if (definition.hasAttribute('inline')) {
            const instance = document.createElement(tagName);

            // Copy over attributes
            for (const { name, value } of definition.attributes) {
                if (name !== 'enso-component' && name !== 'inline') {
                    instance.setAttribute(name, value);
                }
            }
            definition.replaceWith(instance);
        } else {
            definition.remove();
        }

        return component;
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
