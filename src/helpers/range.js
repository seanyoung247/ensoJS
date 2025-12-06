
/**
 * A Python-like numeric range.
 *
 * Behaves like Python's `range()`:
 * - `range(stop)` → 0..stop-1
 * - `range(start, stop)` → start..stop-1
 * - `range(start, stop, step)` → arithmetic progression
 *
 * Supports floats with safe stepping via normalisation.
 * Stop is always exclusive.
 */
export class Range {
    static isRange(obj) {
        return obj instanceof Range;
    }

    constructor(start, stop = undefined, step = undefined) {
        if (stop === undefined) {
            stop = start;
            start = 0;
        }

        if (step === undefined) {
            step = start < stop ? 1 : -1;
        }

        Object.defineProperties(this, {
            _start: { value: start, enumerable: true, writable: false },
            _stop:  { value: stop, enumerable: true, writable: false },
            _step:  { value: step, enumerable: true, writable: false }
        });

        this._normaliser = 1e10;

        if (!Number.isFinite(start) || !Number.isFinite(stop) || !Number.isFinite(step)) {
            throw new TypeError("Invalid range parameters");
        }
    }

    get size() {
        const normStart = normalise(this._start, this);
        const normStop  = normalise(this._stop,  this);
        const normStep  = normalise(this._step,  this);

        if (normStep === 0) return 0;

        const diff = normStop - normStart;

        if (normStep > 0 && diff <= 0) return 0;
        if (normStep < 0 && diff >= 0) return 0;

        return Math.max(0, Math.ceil(diff / normStep));
    }

    get maxStep() {
        const size = this.size;
        if (size === 0) return undefined;
        return this.step(size - 1);
    }

    *[Symbol.iterator]() {
        const normStart = normalise(this._start, this);
        const normStep  = normalise(this._step, this);
        let count = normStart;

        for (let i = 0; i < this.size; i++) {
            yield deNormalise(count, this);
            count += normStep;
        }
    }

    step(index) {
        if (!Number.isInteger(index) || index < 0 || index >= this.size) {
            throw new Error('Invalid index');
        }
        return indexToStep(index, this);
    }

    indexOf(value) {
        if (!this.inRange(value)) return -1;
        return stepToIndex(value, this);
    }

    inRange(value) {
        const min = Math.min(this._start, this._stop);
        const max = Math.max(this._start, this._stop);
        if (value < min || value >= max) return false;

        const normValue  = normalise(value, this);
        const normStart  = normalise(this._start, this);
        const normStep   = normalise(this._step, this);

        return (normValue - normStart) % normStep === 0;
    }

    wrap(value) {
        const min = Math.min(this._start, this._stop);
        const rawRange = this._stop - this._start;
        const wrapped = (((value - min) % rawRange) + rawRange) % rawRange + min;

        // Snap into valid step *and snap down to maxStep if needed*
        return makeValidStep(
            Math.min(wrapped, this.maxStep),
            this
        );
    }

    clamp(value) {
        const min = Math.min(this._start, this._stop);
        const max = this.maxStep;   // last valid step
        const clamped = Math.min(Math.max(value, min), max);
        return makeValidStep(clamped, this);
    }
}

/**
 * Create a Python-style range.
 *
 * @param {number} start - Start value or stop if only one argument.
 * @param {number} [stop] - Exclusive stop value.
 * @param {number} [step] - Step interval (default: 1 or -1 based on direction).
 * @returns {Range}
 */
export function range(start, stop, step) {
    return new Range(start, stop, step);
}

/* Helper functions */
function normalise(value, rng) {
    return Math.round(value * rng._normaliser);
}

function deNormalise(value, rng) {
    return value / rng._normaliser;
}

function stepToIndex(value, rng) {
    return (normalise(value, rng) - normalise(rng._start, rng)) / normalise(rng._step, rng);
}

function indexToStep(index, rng) {
    return deNormalise(normalise(rng._start, rng) + (normalise(rng._step, rng) * index), rng);
}

function makeValidStep(value, rng) {
    return indexToStep(Math.round(stepToIndex(value, rng)), rng); 
}
