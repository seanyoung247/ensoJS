
import { describe, it, expect, vi } from 'vitest';


describe('enso-fragment definition guard', () => {
    it('does not redefine the element when it already exists', async () => {
        vi.resetModules();

        const define = vi.fn();
        const get = vi.fn(() => true); // "already defined"

        vi.stubGlobal('customElements', { define, get });
        await import('../../src/core/fragment.js');

        expect(define).not.toHaveBeenCalled();
        expect(get).toHaveBeenCalled();
    });

    it('defines the element when missing', async () => {
        vi.resetModules();

        const define = vi.fn();
        const get = vi.fn(() => undefined); // "not defined"

        vi.stubGlobal('customElements', { define, get });

        await import('../../src/core/fragment.js');

        expect(define).toHaveBeenCalledOnce();
    });
});
