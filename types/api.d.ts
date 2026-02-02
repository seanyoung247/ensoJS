
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import type { EnsoTemplate } from "./template";
import type { ParserFunction } from "./parser";


/* Lifecycle identifiers */
export const lifecycle: {
  mount: string;
  update: string;
  unmount: string;
};

export interface ComponentSettings {
  useShadow?: boolean;
  shadowMode?: ShadowRootMode; // 'open' | 'closed'
}

export interface ComponentDefinition {
    template: EnsoTemplate;
    styles?: CSSStyleSheet;
    expose?: Record<string, unknown>;
    watched?: Record<string, unknown>;
    script?: Record<string, unknown>;
    settings?: ComponentSettings;
}

export interface ComponentTag {
  (
    attrs?: Record<string, unknown> | null,
    children?: string | null
  ): string;

  toString(): string;
  readonly tag: string;
  readonly Class: CustomElementConstructor;
}

export interface EnsoAPI {
    /**
     * Defines a new Enso component and registers it in the browser as a custom element.
     * @param {String} tag                      - DOM tag name for this component
     * @param {Object} props                    - Component properties
     *  @param {EnsoTemplate} props.template    - Template defining component HTML
     *  @param {CSSStyleSheet|CSSStyleSheet[]} [props.styles] - (Optional) Adoptable Style sheet(s)
     *  @param {Object} [props.expose]          - (optional) Objects to expose to template expressions
     *  @param {Object} [props.watched]         - (optional) This component's watched properties
     *  @param {Object} [props.script]          - (Optional) Custom component code implementation
     *  @param {ComponentSettings} [props.settings]  - (Optional) Settings object
     * @returns {ComponentTag} - A callable tag function for use in templates
     * 
     * @example
     * const MyCounter = Enso.component('my-counter', {
     *   watched: { count: 0 },
     *   template: html`<button @click="this.increment">{{ @:count }}</button>`,
     *   script: {
     *     increment() { this.count++; }
     *   }
     * });
     */
    component(tag: string, props: ComponentDefinition): ComponentTag;
    /**
     * Adds a custom template parser.
     * @param {ParserFunction} plugin - Custom parser registration function
     */    
    use(plugin: ParserFunction): void;
    /**
     * Enables verbose diagnostic mode.
     * @async
     */
    enableDiagnostics(): Promise<void>;
    /**
     * Disables verbose diagnostic mode
     */
    disableDiagnostics(): void;
}

declare const Enso: EnsoAPI;

export default Enso;
export { Enso };
