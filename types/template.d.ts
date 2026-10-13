
declare const ensoTemplateBrand: unique symbol;

/**
 * An HTML template created by Enso's `html` template tag.
 */
export type EnsoTemplate = {
    readonly [ensoTemplateBrand]: true;
};

/* Template tags */

/**
 * Creates a constructable stylesheet from a template string.
 */
export function css(
    source: string
): CSSStyleSheet;

export function css(
    strings: TemplateStringsArray,
    ...values: unknown[]
): CSSStyleSheet;

/**
 * Parses a template string and returns an Enso HTML template.
 */
export function html(
    source: string
): EnsoTemplate;

export function html(
    strings: TemplateStringsArray,
    ...values: unknown[]
): EnsoTemplate;
