 
import { describe, it, expect, vi } from 'vitest';
import { setErrorResolver, ensoError, ensoReport} from '../../src/core/errors';
import { Enso, html } from '../../src/enso'


describe('Enso diagnostics', () => {

    it('uses custom error resolver when set', () => {
        setErrorResolver((code) => `ERR ${code}`);
        expect(() => ensoError(123)).toThrow('ERR 123');
    });

    it('falls back to default error when resolver is cleared', () => {
        setErrorResolver(null);
        expect(() => ensoError(123)).toThrow(/123/);
    });

    it('reports errors via component report wrapper', () => {
        Enso.component('test-component', {
            template: html`<div></div>`,
        });
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const el = document.createElement('test-component');

        el._report('error', 201);

        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('enables diagnostics and sets resolver', async () => {
        await Enso.enableDiagnostics();
        expect(() => ensoError(201)).toThrow(/Unsupported attribute type/i);
    });

    it('does not set resolver if diagnostics disabled during load', async () => {
        const promise = Enso.enableDiagnostics();
        Enso.disableDiagnostics();
        await promise;

        expect(() => ensoError(201)).toThrow(/201/);
    });

    it('fails silently if incorrect data is passed', () => {
        
        expect(()=>ensoReport('defcon1', 201, null)).not.toThrow();

    });
});
