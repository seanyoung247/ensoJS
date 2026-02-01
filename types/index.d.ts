
export type EnsoTemplate = unknown;

export interface ComponentSettings {
  useShadow?: boolean;
  shadowMode?: ShadowRootMode; // 'open' | 'closed'
}

export interface ComponentDefinition {
    template: EnsoTemplate,
    styles?: CSSStyleSheet,
    expose?: Record<string, unknown>,
    watched?: Record<string, unknown>,
    script?: Record<string, unknown>,
    settings?: ComponentSettings,
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


export interface ParserRegister {
  generator(plugin: unknown): void;
  attribute(plugin: unknown): void;
  content(plugin: unknown): void;
}

export interface ParserContext {
  Effect: unknown;
  Action: unknown;
  compileValue: (...args: any[]) => unknown;

  addBinding: (...args: any[]) => void;
  addWatcher: (...args: any[]) => void;

  parseSource: (...args: any[]) => unknown;
  collectBindings: (...args: any[]) => unknown;

  EnsoFragment: CustomElementConstructor;
}

export type ParserFunction = (
  register: ParserRegister,
  ctx: ParserContext
) => void;


export interface EnsoAPI {
    component(tag: string, props: ComponentDefinition): ComponentTag,
    use(plugin: ParserFunction): void,
    enableDiagnostics(): void;
    disableDiagnostics(): void;
}

export default Enso;
export const Enso: EnsoAPI;

/* Template tags */
export function css(
  strings: TemplateStringsArray,
  ...values: unknown[]
): CSSStyleSheet;

export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): EnsoTemplate;

/* Lifecycle identifiers */
export const lifecycle: {
  mount: string;
  update: string;
  unmount: string;
};

/* Watched helpers */
export type EnsoAttr = string | number | boolean;
export type EnsoAttrType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor;

export function prop(
  value?: unknown,
  deep?: boolean
): object;

export function attr(
  value?: EnsoAttr,
  type?: EnsoAttrType
): object;

export function computed(
  fn: Function,
  deps: string[]
): object;

export function watches(
  fn: Function,
  props?: string[],
  keep?: boolean
): Function;

export function getWatched(
  component: unknown
): Record<string, unknown>;

export function setWatched(
  component: unknown,
  values: Record<string, unknown>
): void;
