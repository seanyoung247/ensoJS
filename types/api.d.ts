
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import type { EnsoTemplate } from "./template";
import type { ParserFunction } from "./parser";


/* Lifecycle identifiers */
export const lifecycle: {
    readonly mount: 'lifecycle:mount';
    readonly update: 'lifecycle:update';
    readonly unmount: 'lifecycle:unmount';
};

export interface ComponentSettings {
    useShadow?: boolean;
    shadowMode?: ShadowRootMode;
}

export interface ComponentDefinition {
    template: EnsoTemplate;
    styles?: CSSStyleSheet | readonly CSSStyleSheet[];
    expose?: Record<string, unknown>;
    watched?: Record<string, unknown>;
    script?: Record<string, unknown>;
    settings?: ComponentSettings;
}

export interface EnsoComponentConstructor extends CustomElementConstructor {
  readonly tagName?: string;
}

export interface RegisteredEnsoComponentConstructor
  extends EnsoComponentConstructor {
  readonly tagName: string;
}

export interface EnsoAPI {
  readonly version: string;

  /**
   * Defines a new Enso component class without registering it.
   */
  define(
    props: ComponentDefinition
  ): EnsoComponentConstructor;

  /**
   * Registers an Enso component class as a custom element.
   */
  register(
    tag: string,
    component: EnsoComponentConstructor
  ): RegisteredEnsoComponentConstructor;

  /**
   * Defines and registers a new Enso component.
   */
  component(
    tag: string,
    props: ComponentDefinition
  ): RegisteredEnsoComponentConstructor;

  use(plugin: ParserFunction): void;

  enableDiagnostics(): Promise<void>;

  disableDiagnostics(): void;
}

declare const Enso: EnsoAPI;

export default Enso;
export { Enso };
