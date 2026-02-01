
/* types/helpers.d.ts */

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

  readonly size: number;
  readonly maxStep?: number;

  [Symbol.iterator](): Iterator<number>;

  step(index: number): number;
  indexOf(value: number): number;
  inRange(value: number): boolean;
  wrap(value: number): number;
  clamp(value: number): number;
}

export function range(
  start: number,
  stop?: number,
  step?: number
): Range;

/* resource loader */
export function load(
  base: string,
  ...files: string[]
): Promise<unknown>;
