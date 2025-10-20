

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
    getName, 
    getBindings,
    bindSource,
    addBinding,
    isAttr,
    createPlaceholder, 
    getDirective
} from '../../src/templates/parsers/utils';
import { ADD_BINDING, SCHEDULE_EFFECT } from '../../src/core/symbols';

describe('getName', () => {

    it("it to return name portion of bound attribute", () => {
        const attr = {
            name: "@test",
        };

        expect(getName(attr)).toBe('test');
    });

});

describe('getBindings', () => {

    it('returns potential binding names from a text source', () => {
        const bindings = new Set();
        const source = "{{ this.watched.test === watched:prop1 + watched.prop2 }}";

        getBindings(source, bindings);
        expect(bindings.size).toBe(3);
        expect(bindings.has('prop1')).toBe(true);
    });

});


describe('bindSource', () => {

    it('returns potential binding names from a text source', () => {
        const bindings = new Set();
        const source = "{{ this.watched.test === watched:prop1 + watched.prop2 }}";

        const transformed = bindSource(source, bindings);
        expect(bindings.size).toBe(3);
        expect(bindings.has('prop1')).toBe(true);
        expect(transformed).toBe(
            '{{ this.watched.test === this.watched.prop1 + this.watched.prop2 }}'
        );
    });

});

describe('addBinding', () => {
    it('pushes effect and marks changed', () => {
        const effects = new Map();
        const parent = {
        [ADD_BINDING](bind, effect) {
            effects.set(bind, effect);
        },
        [SCHEDULE_EFFECT]: vi.fn(),
        };
        const effect = { dummy: true };
        addBinding(parent, 'test', effect);

        expect(effects.has('test')).toBe(true);
        expect(effects.size).toBe(1);
    });
});

describe('isAttr', () => {

    it('detects if an attribute matches the correct pattern', () => {
        
        expect(isAttr({name:'@test'}, '@')).toBe(true);
        expect(isAttr({name:'@test'}, '!')).toBe(false);

    });

    it('deals with invalid input', () => {

        expect(isAttr(null, '@')).toBe(false);
        expect(isAttr({name:'@test'}, null));

    });

});

describe('createPlaceholder', () => {
  it('creates a template element', () => {
    const el = createPlaceholder();
    expect(el.tagName).toBe('TEMPLATE');
  });
});

describe('getDirective', () => {
    let noDir, single, multi;

    beforeEach(() => {
        const div = document.createElement('DIV');
        div.innerHTML = '<div></div>';
        noDir = div.firstElementChild;
        div.innerHTML = '<div *if="{{ watched.test }}"></div>';
        single = div.firstElementChild;
        div.innerHTML = `
            <div 
                *if="{{ watched.test }}"
                *for="{{ item of list }}"
                enso-if="{{ watched.test2 }}"
            >
            </div>`;
        multi = div.firstElementChild;
    });

    it('handles no directives', () => {
        expect(getDirective(noDir),'*if','enso-if').toBeNull();
        expect(getDirective(null)).toBeNull();
    });

    it('Handles single directives', () => {
        const dir = getDirective(single,'*if','enso-if');
        expect(dir).not.toBeNull();
        expect(dir).toBeDefined();
        // Correct attribute returned
        expect(dir).toBe('{{ watched.test }}');
    });

    it('handles multiple directives', () => {
        const dir = getDirective(multi,'*if','enso-if');
        expect(dir).not.toBeNull();
        expect(dir).toBeDefined();
        // Correct attribute returned
        expect(dir).toBe('{{ watched.test }}');
    });

});