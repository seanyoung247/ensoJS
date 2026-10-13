
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

/* types/helpers.d.ts */

import type {
    RegisteredEnsoComponentConstructor
} from './api';


/* css helpers */
export function classList(
  ...classes: unknown[]
): string;

export function cssObj(
  css: Record<string, unknown>
): string;

/* range helpers */
export class Range implements Iterable<number> {
    constructor(
        start: number,
        stop?: number,
        step?: number
    );

    static isRange(obj: unknown): obj is Range;

    readonly start: number;
    readonly stop: number;
    readonly size: number;
    readonly stepSize: number;
    readonly lastStep: number | undefined;

    [Symbol.iterator](): Iterator<number>;

    step(index: number): number;
    indexOf(value: number): number;
    inRange(value: number): boolean;
    wrap(value: number): number | undefined;
    clamp(value: number): number | undefined;
}

export function range(
    start: number,
    stop?: number,
    step?: number
): Range;

/* resource loader */
export type ResourceResolver = (file: string) => string;

export interface LoadResource<T = unknown> {
    file: string;
    as?: (text: string) => T;
}

type LoadedResource<T> =
    T extends string
        ? string
        : T extends { as: (text: string) => infer R }
            ? R
            : T extends LoadResource<any>
                ? string
                : never;

export function load<
    const T extends readonly (string | LoadResource<any>)[]
>(
    base: string | ResourceResolver,
    ...files: T
): Promise<{
    [K in keyof T]: LoadedResource<T[K]>
}>;

/**
 * Comp component generator/helper
 */
export interface ComponentFactory {
    (
        attrs?: Record<string, unknown> | null,
        children?: string | null
    ): HTMLElement;

    readonly tag: string;

    html(
        attrs?: Record<string, unknown> | null,
        children?: string | null
    ): string;

    readonly Class: RegisteredEnsoComponentConstructor;
}

export function comp(
    ComponentClass: RegisteredEnsoComponentConstructor
): ComponentFactory;
