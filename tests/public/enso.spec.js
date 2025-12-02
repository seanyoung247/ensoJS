
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { testMode } from '../shared.js';


let Enso;
beforeAll(async () => {
  const mod = await testMode.importModule();
  ({ default: Enso } = mod);
});



describe('Enso.component duplicate-definition guard', () => {
    it('throws an error if the custom element is already defined', async () => {
        // Clear module cache so we get a clean import
        vi.resetModules();

        // Create fake customElements
        const define = vi.fn();
        const get = vi.fn(() => true); // Pretend it already exists

        vi.stubGlobal('customElements', { define, get });

        expect(() => {
            Enso.component('my-test', class {});
        }).toThrow('[Enso] Component "my-test" is already defined.');

        expect(get).toHaveBeenCalledWith('my-test');
        expect(define).not.toHaveBeenCalled();
    });
});

it('defines the component when not previously registered', async () => {
    vi.resetModules();

    const define = vi.fn();
    const get = vi.fn(() => undefined);

    vi.stubGlobal('customElements', { define, get });

    const config = {template: '<div></div>'};
    const ComponentClass = Enso.component('my-test', config);

    expect(typeof ComponentClass).toBe('function');
    expect(Object.getPrototypeOf(ComponentClass.prototype))
        .toBeInstanceOf(HTMLElement);
    expect(get).toHaveBeenCalledWith('my-test');
    expect(define).toHaveBeenCalledWith('my-test', ComponentClass);
});
