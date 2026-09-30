
const NORMALISER = 1e10;

/**
 * A Python-inspired numeric range.
 *
 * Inspired by Python's `range()`:
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

    #start;
    #stop;
    #step;
    #size;

    constructor(start, stop = undefined, step = undefined) {
        [ this.#start, this.#stop, this.#step ] = 
            validateRange(start, stop, step);

        this.#size = calcSize(this);
    }

    get start() { return this.#start; }
    get stop() { return this.#stop; }
    get stepSize() { return this.#step; }
    get size() { return this.#size; }

    get lastStep() {
        const size = this.#size;
        if (size === 0) return undefined;
        return this.step(size - 1);
    }

    *[Symbol.iterator]() {
        for (let i = 0; i < this.#size; i++) {
            yield indexToStep(i, this);
        }
    }

    step(index) {
        if (!Number.isInteger(index) || index < 0 || index >= this.#size) {
            throw new Error('Invalid index');
        }
        return indexToStep(index, this);
    }

    indexOf(value) {
        if (!this.inRange(value)) return -1;
        return stepToIndex(value, this);
    }

    inRange(value) {
        if (!isValidValue(value)) return false;

        const index = stepToIndex(value, this);

        return Number.isInteger(index) &&
            index >= 0 &&
            index < this.#size;
    }

    wrap(value) {
        validateValue(value);
        if (this.#size === 0) return undefined;

        const size = this.#size;
        const index = Math.round(stepToIndex(value, this));
        const wrappedIndex = ((index % size) + size) % size;

        return indexToStep(wrappedIndex, this);
    }

    clamp(value) {
        validateValue(value);
        if (this.#size === 0) return undefined;

        const size = this.#size;
        const index = Math.round(stepToIndex(value, this));
        const clamped = Math.max(0, Math.min(index, size - 1));

        return indexToStep(clamped, this);
    }
}

/**
 * Creates a Python-inspired range.
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
function normalise(value) {
    return Math.round(value * NORMALISER);
}

function deNormalise(value) {
    return value / NORMALISER;
}

function stepToIndex(value, rng) {
    const index = (normalise(value) - normalise(rng.start)) /
                  normalise(rng.stepSize);

    return index === 0 ? 0 : index;
}

function indexToStep(index, rng) {
    return deNormalise(normalise(rng.start) + (normalise(rng.stepSize) * index));
}

function calcSize(rng) {
    const normStart = normalise(rng.start);
    const normStop  = normalise(rng.stop);
    const normStep  = normalise(rng.stepSize);
    const diff = normStop - normStart;

    if (normStep > 0 && diff <= 0) return 0;
    if (normStep < 0 && diff >= 0) return 0;

    return Math.max(0, Math.ceil(diff / normStep));
} 

function isValidValue(value) {
    return Number.isFinite(value) &&
           Number.isSafeInteger(normalise(value));
}

function validateValue(value) {
    if (!isValidValue(value)) {
        throw new TypeError("Invalid range value");
    }
}

function validateRange(start, stop, step) {
    if (stop === undefined) {
        stop = start;
        start = 0;
    }

    if (step === undefined) {
        step = start < stop ? 1 : -1;
    }

    if (
        !Number.isFinite(start) ||
        !Number.isFinite(stop) ||
        !Number.isFinite(step) ||
        step === 0
    ) {
        throw new TypeError("Invalid range parameters");
    }

    const values = [start, stop, step].map(normalise);
    const [normStart, normStop, normStep] = values;

    if (normStep === 0) {
        throw new RangeError(
            "Step is smaller than the supported precision"
        );
    }

    if (
        !values.every(Number.isSafeInteger) ||
        !Number.isSafeInteger(normStop - normStart)
    ) {
        throw new RangeError(
            "Range exceeds supported numerical precision"
        );
    }

    return [start, stop, step];
}
