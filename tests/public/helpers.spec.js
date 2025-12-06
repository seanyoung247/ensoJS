
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect, beforeAll } from 'vitest';
import { testMode } from '../shared.js';


let classList, cssObj, Range, range;
beforeAll(async () => {
    const mod = await testMode.importHelpers();
    ({ classList, cssObj, Range, range } = mod);
});


describe('classList', () => {
    it('joins truthy values into a space-separated string', () => {
        expect(classList('foo', 'bar')).toBe('foo bar');
    });

    it('ignores falsy values', () => {
        expect(classList('foo', null, undefined, '', false, 'bar')).toBe('foo bar');
    });

    it('returns empty string if all falsy', () => {
        expect(classList('', false, null)).toBe('');
    });
});


describe('cssObj', () => {
    it('converts a flat object to a CSS string', () => {
        const result = cssObj({ color: 'red', fontSize: '12px' });
        expect(result).toContain('color:red;');
        expect(result).toContain('font-size:12px;');
    });

    it('handles nested objects as selectors', () => {
        const result = cssObj({
        color: 'red',
        '.child': { fontSize: '14px' },
        });
        expect(result).toContain('color:red;');
        expect(result).toContain('.child {font-size:14px;}');
    });

    it('skips falsy values', () => {
        const result = cssObj({ color: '', fontSize: null, display: 'block' });
        expect(result).toBe('display:block;');
    });

    it('handles deep nesting', () => {
        const result = cssObj({
        '.parent': { '.child': { color: 'blue' } },
        });
        expect(result).toBe('.parent {.child {color:blue;}\n}\n');
    });
});


describe('Range class (Python semantics)', () => {

    describe('range detection', () => {
        it('detects a valid range class', () => {
            const rng = new Range(1);
            expect(Range.isRange(rng)).toBe(true);
        });
        it('detects an non range class', () => {
            const notRng = {};
            expect(Range.isRange(notRng)).toBe(false);
        });
    });

    describe('range creation', () => {

        it('range(5) → 0..4', () => {
            compareRangeValues(new Range(5), [0,1,2,3,4]);
        });

        it('range(1,5) → 1..4', () => {
            compareRangeValues(new Range(1, 5), [1,2,3,4]);
        });

        it('range(1,10,2) → odd numbers but stop excluded', () => {
            compareRangeValues(new Range(1, 10, 2), [1,3,5,7,9]);
        });

        it('reverse ranges exclude stop', () => {
            compareRangeValues(new Range(10, 1), [10,9,8,7,6,5,4,3,2]);
        });

        it('floating point ranges stop before stop', () => {
            compareRangeValues(new Range(0.5, 0.55, 0.01), [0.5,0.51,0.52,0.53,0.54]);
        });

        it('Handles ranges with no valid steps', () => {
            compareRangeValues(new Range(10,1,1), []);
        });

        it('Throws error on incorrect parameters', () => {
            expect(() => new Range()).toThrow();
            expect(() => new Range(1, 10, '2')).toThrow();
            expect(() => new Range(1, {}, 2)).toThrow();
        });

        it('helper function works', () => {
            compareRangeValues(range(5), [0,1,2,3,4]);
            compareRangeValues(range(1,5), [1,2,3,4]);
            compareRangeValues(range(1,10,2), [1,3,5,7,9]);
            compareRangeValues(range(10,1), [10,9,8,7,6,5,4,3,2]);
            compareRangeValues(range(0.5,0.55,0.01), [0.5,0.51,0.52,0.53,0.54]);
        });
    });

    describe('Range iteration', () => {

        it('forward iteration', () => {
            compareRangeValues(new Range(10), [...Array(10).keys()]);
        });

        it('reverse iteration', () => {
            compareRangeValues(new Range(10,0,-1), [10,9,8,7,6,5,4,3,2,1]);
        });

        it('floating iteration', () => {
            compareRangeValues(
                new Range(0,5,0.5),
                [0,0.5,1,1.5,2,2.5,3,3.5,4,4.5]
            );
        });

        it('spread operator works', () => {
            expect([...range(5)]).toEqual([0,1,2,3,4]);
        });

        it("iterator yields nothing when size=0", () => {
            const r = new Range(5, 5, 1);
            expect([...r]).toEqual([]);
        });
    });

    describe('Range properties', () => {

        it('size is correct (exclusive)', () => {
            expect(new Range(10).size).toBe(10);
            expect(new Range(10,0,-1).size).toBe(10);
        });

        it("size = 0 when step is zero", () => {
            const r = new Range(0, 10, 0);
            expect(r.size).toBe(0);
        });

        it("size = 0 when step > 0 but diff <= 0", () => {
            const r = new Range(5, 2, 1); // diff < 0
            expect(r.size).toBe(0);
        });

        it("size = 0 when step < 0 but diff >= 0", () => {
            const r = new Range(2, 5, -1); // diff > 0
            expect(r.size).toBe(0);
        });

        it("size positive normal (ascending)", () => {
            const r = new Range(0, 5, 1);
            expect(r.size).toBe(5);
        });

        it("size positive normal (descending)", () => {
            const r = new Range(5, 0, -1);
            expect(r.size).toBe(5);
        });

        it("maxStep returns last valid step", () => {
            const r = new Range(0, 5, 1);
            expect(r.maxStep).toBe(4);
        });

        it("maxStep with empty range gives undefined", () => {
            const r = new Range(5, 5, 1);
            expect(r.maxStep).toBeUndefined();
        });

        it('Range properties are read-only', () => {
            const rng = new Range(10);
            expect(() => (rng._start = 1)).toThrow();
            expect(() => (rng._stop = 8)).toThrow();
            expect(() => (rng._step = 2)).toThrow();
        });

        it('Normaliser is writable', () => {
            const rng = new Range(10);
            expect(() => (rng._normaliser = 1)).not.toThrow();
            expect(rng._normaliser).toBe(1);
        });
    });

    describe('Range values', () => {

        describe('inRange detection', () => {

            it('valid integer values', () => {
                expect(new Range(0,10,2).inRange(6)).toBe(true);
            });

            it('valid float values', () => {
                expect(new Range(0,2,0.25).inRange(0.75)).toBe(true);
            });

            it('values outside range', () => {
                const rng = new Range(10);
                expect(rng.inRange(-4)).toBe(false);
                expect(rng.inRange(12)).toBe(false);
            });

            it('invalid steps', () => {
                const rng = new Range(0,10,2);
                expect(rng.inRange(5)).toBe(false);
                expect(rng.inRange(6.5)).toBe(false);
            });
        });

        describe('index and step', () => {

            it('get step from index', () => {
                const rng = new Range(0,10,2);
                expect(rng.step(3)).toBe(6);
            });

            it('get index from step', () => {
                const rng = new Range(0,10,2);
                expect(rng.indexOf(8)).toBe(4);
            });
            
            it("indexOf: aligned valid value returns correct index", () => {
                const rng = new Range(0, 10, 2);
                expect(rng.indexOf(4)).toBe(2);
            });

            it("indexOf: value out of range returns -1", () => {
                const r = new Range(0, 10, 2);
                expect(r.indexOf(11)).toBe(-1);
            });

            it('throws on invalid index', () => {
                const rng = new Range(0,10,2);
                expect(() => rng.step(-1)).toThrow();
                expect(() => rng.step(99)).toThrow();
            });
        });
    });

    describe('wrap and clamp', () => {

        describe('wrap()', () => {

            it('wrap below min', () => {
                const rng = new Range(0,5,0.25);
                expect(rng.wrap(-0.25)).toBe(4.75);
            });

            it('wrap above max', () => {
                const rng = new Range(0,5,0.25);
                expect(rng.wrap(5.5)).toBe(0.5);
            });

            it('snap to valid step', () => {
                const rng = new Range(0,5,0.25);
                expect(rng.wrap(1.23)).toBe(1.25);
            });
        });

        describe('clamp()', () => {

            it('clamp below', () => {
                const rng = new Range(0,5,0.25);
                expect(rng.clamp(-1)).toBe(0);
            });

            it('clamp above (snap to last valid step)', () => {
                const rng = new Range(0,5,0.25);
                expect(rng.clamp(6)).toBe(4.75);
            });

            it('snap to valid step', () => {
                const rng = new Range(0,5,0.25);
                expect(rng.clamp(1.23)).toBe(1.25);
            });

            it("clamp inside range stays unchanged", () => {
                const rng = new Range(0, 5, 1);
                expect(rng.clamp(2)).toBe(2);
            });

            it("clamp snaps to nearest step", () => {
                const rng = new Range(0, 5, 1);
                expect(rng.clamp(2.7)).toBe(3);
            });
        });
    });
});


function compareRangeValues(rng, vals) {
    let i = 0;
    expect(rng.size).toBe(vals.length);
    for (const val of rng) {
        expect(val).toBe(vals[i++]);
    }
}
