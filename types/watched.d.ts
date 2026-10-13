
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.


export type EnsoAttr = string | number | boolean | null;
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
 * - Automatically detects the attribute type from a non-null default value.
 * - If the default value is null or omitted, the attribute type defaults to String.
 * - The inferred/default type can be overridden with String, Number, or Boolean.
 * - Rejects object values and unsupported constructors.
 *
 * @param value - Default attribute value.
 * @param type - Explicit attribute type. Defaults to String when it cannot be inferred from the value.
 * @returns A descriptor object consumed by the watched system.
 */
export function attr(
  value?: EnsoAttr,
  type?: EnsoAttrType
): object;

/**
 * A function invoked in response to a watched property or lifecycle change.
 *
 * @param prop - Name of the changed property or lifecycle event.
 * @param value - New value of the changed property.
 */
export type Watcher<T = void> = (
  prop: string,
  value: unknown
) => T;

/**
 * Creates a computed watched property descriptor.
 *
 * The watcher is rerun when one of its dependencies changes and its
 * return value becomes the new value of the computed property.
 */
export function computed<T>(
  fn: Watcher<T>,
  deps: readonly string[]
): object;

/**
 * Tags a watcher to run when one of its dependencies changes.
 *
 * @param fn - Watcher to invoke.
 * @param deps - Watched properties or lifecycle events to observe.
 * @param keep - If true, the function is exposed on the component. Defaults to false.
 */
export function watches<T extends Watcher<void>>(
  fn: T,
  deps?: readonly string[],
  keep?: boolean
): T;
