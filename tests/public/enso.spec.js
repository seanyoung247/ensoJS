
import { it, expect, beforeAll, describe } from 'vitest';
import { testMode } from '../shared.js';



describe('Enso', () => {
    let Enso

    beforeAll(async () => {
        const mod = await testMode.importModule();
        ({ default: Enso } = mod);
    });

    describe('Enso.component', () => {
        it('returns the registered component class', () => {
            const tag = 'my-test';
            const ComponentClass = Enso.component(tag, {
                template: '<div></div>'
            });

            expect(typeof ComponentClass).toBe('function');
            expect(ComponentClass.tagName).toBe(tag);
            expect(customElements.get(tag)).toBe(ComponentClass);
            expect(Object.getPrototypeOf(ComponentClass.prototype))
                .toBeInstanceOf(HTMLElement);
        });
    });

    describe('Enso.define', () => {
        it('creates a component class without registering it', () => {
            const tag = 'enso-define-test';

            const ComponentClass = Enso.define({
                template: '<div></div>'
            });

            expect(typeof ComponentClass).toBe('function');
            expect(Object.getPrototypeOf(ComponentClass.prototype))
                .toBeInstanceOf(HTMLElement);

            expect(customElements.get(tag)).toBeUndefined();
        });
    });

    describe('Enso.register', () => {
        it('registers and returns the component class', () => {
            const tag = 'enso-register-test';
            const ComponentClass = Enso.define({
                template: '<div></div>'
            });

            const result = Enso.register(tag, ComponentClass);

            expect(result).toBe(ComponentClass);
            expect(result.tagName).toBe(tag);
            expect(customElements.get(tag)).toBe(ComponentClass);
        });

        it('returns the same class if already registered', () => {
            const tag = 'enso-register-existing-test';
            const ComponentClass = Enso.define({
                template: '<div></div>'
            });

            Enso.register(tag, ComponentClass);
            const result = Enso.register(tag, ComponentClass);

            expect(result).toBe(ComponentClass);
            expect(result.tagName).toBe(tag);
            expect(customElements.get(tag)).toBe(ComponentClass);
        });

        it('throws if the tag is used by another component', () => {
            const tag = 'enso-register-conflict-test';

            const ComponentA = Enso.define({
                template: '<div></div>'
            });

            const ComponentB = Enso.define({
                template: '<span></span>'
            });

            Enso.register(tag, ComponentA);

            expect(() => {
                Enso.register(tag, ComponentB);
            }).toThrow();
        });
    });
});
