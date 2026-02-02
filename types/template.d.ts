
export type EnsoTemplate = unknown;

/* Template tags */

/**
 * Parses a template string and returns an Enso stylesheet
 * @param {TemplateStringsArray} strings 
 * @param {unknown[]} values 
 * @returns {CSSStyleSheet}
 */
export function css(
  strings: TemplateStringsArray,
  ...values: unknown[]
): CSSStyleSheet;

/**
 * Parses a template string and returns an Enso HTML template
 * @param {TemplateStringsArray} strings 
 * @param {unknown[]} values 
 * @returns {EnsoTemplate}
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): EnsoTemplate;
