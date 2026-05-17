
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.


export type EnsoAttr = string | number | boolean;
export type EnsoAttrType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor;

/**
 * Create a watched property descriptor.
 *
 * - If `deep` is true AND `value` is a non-null object, deep reactivity is enabled.
 * - Primitive values always produce shallow descriptors.
 *
 * @param {unknown} value - Initial property value.
 * @param {boolean} [deep=false] - Whether to enable deep reactivity if the value is an object.
 * @returns {object} - A property descriptor object consumed by the watched system.
 */
export function prop(
  value?: unknown,
  deep?: boolean
): object;

/**
 * Create a watched attribute descriptor (string/number/boolean).
 *
 * - Automatically detects type from the default value if provided.
 * - Rejects object values and unsupported constructors.
 *
 * @param {string|number|boolean|null} value - Default attribute value. If non-null, determines the attribute type unless explicitly overridden.
 * @param {Function} [type=String] - Constructor representing the expected attribute type (String, Number, Boolean).
 * @throws {Error} - If value is an object, or type is not in the allowed attributeTypes list.
 * @returns {object} - A descriptor object defining attribute parsing, serialisation, and reactivity.
 */
export function attr(
  value?: EnsoAttr,
  type?: EnsoAttrType
): object;

/**
 * Creates a computed watched property descriptor.
 *  - Reruns the given function and saves the return value whenever
 *      watched properties in deps change.
 * 
 * @param {Function} fn - Function to recalculate computed value.
 * @param {Array<String>} deps - Array of string watched property names.
 * @returns - A descriptor object defining the computed property.
 */
export function computed<T = unknown>(
  fn: () => T,
  deps: string[]
): object;

/**
 * Tags a script method to be notified when watched properties change
 * @param {Function} fn     - The function to call
 * @param {[String]} props  - List of watched properties to watch
 * @returns {Function} The watcher function
 */
export function watches(
  fn: Function,
  props?: string[],
  keep?: boolean
): Function;

/**
 * Get all watched values for a given component.
 * 
 * @param {EnsoComponent} component - The component to retrieve watched values from.
 * @returns {Record<string, unknown>} An object literal containing all watched properties.
 */
export function getWatched(
  component: unknown
): Record<string, unknown>;

/**
 * Set multiple watched values on a component, and triggers updates for changes.
 *
 * @param {EnsoComponent} component - The component whose watched values are being updated.
 * @param {Record<string, unknown>} values - Object containing key/value pairs to update.
 */
export function setWatched(
  component: unknown,
  values: Record<string, unknown>
): void;
