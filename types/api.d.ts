
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

export interface ComponentTag<T extends HTMLElement = HTMLElement> {
    (
        attrs?: Record<string, unknown> | null,
        children?: string | null
    ): T;
    /** Custom element tag name */
    readonly tag: string;
    /** String template factory */
    html(
        attrs?: Record<string, unknown> | null,
        children?: string | null
    ): string;

    readonly Class: CustomElementConstructor;
}

export interface EnsoAPI {
    /**
     * Defines a new Enso component and registers it as a custom element.
     *
     * The returned value is a callable component factory:
     *  - Calling it creates a live element instance.
     *  - The `.html()` method generates a string representation for templates.
     *  - The `.tag` property exposes the custom element tag name.
     *
     * @param tag - Custom element tag name
     * @param props - Component definition
     * @returns A callable component tag factory
     *
     * @example
     * const MyCounter = Enso.component('my-counter', {
     *   watched: { count: 0 },
     *   template: html`<button @click="this.increment">{{ @:count }}</button>`,
     *   script: {
     *     increment() { this.count++; }
     *   }
     * });
     *
     * const el = MyCounter();                    // HTMLElement
     * const htmlStr = MyCounter.html();          // "<my-counter></my-counter>"
     * const raw = document.createElement(MyCounter.tag);
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
