
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
    const ComponentClass = Enso.component('my-test', config).Class;

    expect(typeof ComponentClass).toBe('function');
    expect(Object.getPrototypeOf(ComponentClass.prototype))
        .toBeInstanceOf(HTMLElement);
    expect(get).toHaveBeenCalledWith('my-test');
    expect(define).toHaveBeenCalledWith('my-test', ComponentClass);
});

it ('returns a component tag with correct properties', async () => {
    const config = {template: '<div></div>'};
    const componentTag = Enso.component('my-test', config);

    expect(componentTag.tag).toBe('my-test');
    expect(typeof componentTag.Class).toBe('function');
    expect(Object.getPrototypeOf(componentTag.Class.prototype))
        .toBeInstanceOf(HTMLElement);

    expect(componentTag.toString()).toBe('<my-test></my-test>');
    expect(`${componentTag}`).toBe('<my-test></my-test>');
    expect(`${componentTag`<test>Hello World</test>`}`)
        .toBe('<my-test><test>Hello World</test></my-test>');

    expect(`${componentTag({ id: 'comp1', hidden: true })}`)
        .toBe('<my-test id="comp1" hidden></my-test>');
    expect(`${componentTag({ id: 'comp1', omit1: null, omit2: false })}`)
        .toBe('<my-test id="comp1"></my-test>');
    expect(`${componentTag({ id: 'comp1', hidden: true })`<span>Content</span>`}`)
        .toBe('<my-test id="comp1" hidden><span>Content</span></my-test>');

});