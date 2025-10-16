

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
    getName, 
    getBindings,
    addBinding,
    isAttr,
    createPlaceholder, 
    getDirective
} from '../../src/templates/parsers/utils';
import { GET_BINDING, SCHEDULE_EFFECT } from '../../src/core/symbols';

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
        const source = "{{ this.test === this.prop1 + this.prop2 }}";

        getBindings(source, bindings);
        expect(bindings.size).toBe(3);
        expect(bindings.has('prop1')).toBe(true);
    });

});

describe('addBinding', () => {
  it('pushes effect and marks changed', () => {
    const effects = [];
    const parent = {
      [GET_BINDING]: () => ({ effects, changed: false }),
      [SCHEDULE_EFFECT]: vi.fn(),
    };
    const effect = { dummy: true };
    addBinding(parent, 'test', effect);

    expect(effects).toContain(effect);
    expect(effects.length).toBe(1);
    expect(parent[SCHEDULE_EFFECT]).toHaveBeenCalledWith(effect);
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
        div.innerHTML = '<div *if="{{ this.test }}"></div>';
        single = div.firstElementChild;
        div.innerHTML = `
            <div 
                *if="{{ this.test }}"
                *for="{{ item of list }}"
                *of="{{ this.test2 }}"
            >
            </div>`;
        multi = div.firstElementChild;
    });

    it('handles no directives', () => {
        expect(getDirective(noDir)).toBeNull();
        expect(getDirective(null)).toBeNull();
    });

    it('Handles single directives', () => {
        const dir = getDirective(single);
        expect(dir).not.toBeNull();
        expect(dir).toBeDefined();
        // Correct attribute returned
        expect(dir.name).toBe('*if');
        expect(dir.value).toBe('{{ this.test }}');
        // Directive removed from attributes
        expect(single.attributes.length).toBe(0);
    });

    it('handles multiple directives', () => {
        const dir = getDirective(multi);
        expect(dir).not.toBeNull();
        expect(dir).toBeDefined();
        // Correct attribute returned
        expect(dir.name).toBe('*if');
        expect(dir.value).toBe('{{ this.test }}');
        // Directive removed from attributes
        expect(multi.attributes.length).toBe(0);
    });

});