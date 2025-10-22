
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect } from "vitest";
import EnsoComponent from '../src/component.js';

// EnsoComponent is very heavilly integrated and dependent on other units, 
// as such most testing is e2e.
describe('Enso Component', () => {

    it('prevents subclassing', () => {

        class EnsoSubClass extends EnsoComponent {}
        customElements.define('enso-subclass-test', EnsoSubClass);

        expect(() => new EnsoSubClass()).toThrowError();

    });

});