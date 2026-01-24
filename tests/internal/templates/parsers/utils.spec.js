

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
    getName, 
    collectBindings,
    parseSource,
    addBinding,
    isAttr,
    createPlaceholder, 
    getOperator
} from '../../../../src/templates/parsers/utils';
import { ADD_BINDING, SCHEDULE_EFFECT } from '../../../../src/core/symbols';
import { lifecycle } from '../../../../src/component';

describe('getName', () => {

    it("it to return name portion of bound attribute", () => {
        expect(getName({name: "@test"})).toBe('test');
        expect(getName({name: "enso-If/x"})).toBe('nso-if/x');
    });

});

describe('collectBindings', () => {

    it('returns potential binding names from a text source', () => {
        const bindings = new Set();
        const source = "{{ this.watched.test === watched:prop1 + @:prop2 }}";

        collectBindings(source, bindings);
        expect(bindings.size).toBe(4); // test, prop1, prop2 + mount
        expect(bindings.has('prop1')).toBe(true);
    });

    it('uses default binding if no binding in text source', () => {
        const bindings = new Set();
        const source = "{{ this.method() }}";

        collectBindings(source, bindings);
        expect(bindings.size).toBe(1);
        expect(bindings.has(lifecycle.mount)).toBe(true);
    });

});


describe('parseSource', () => {

    it('returns potential binding names from a text source', () => {
        const bindings = new Set();
        const source = "{{ this.watched.test === watched:prop1 + @:prop2 }}";

        const transformed = parseSource(source, bindings);
        expect(bindings.size).toBe(4);
        expect(bindings.has('prop1')).toBe(true);
        expect(transformed).toBe(
            '{{ this.watched.test === this.watched.prop1 + this.watched.prop2 }}'
        );
    });

    it('detects watched bindings inside nested arrow functions', () => {
        const src = `() => () => @:count + 1`;
        const bindings = new Set();

        const out = parseSource(src, bindings);

        expect(out).toBe(
            `() => () => this.watched.count + 1`
        );

        expect(bindings.has('count')).toBe(true);
        expect(bindings.has('lifecycle:mount')).toBe(true);
    });

    it('Resolves namespaced refs', () => {
        const bindings = new Set();
        const refs = "{{ this.refs.myRef.value === ref:myRef2.value + #:myRef3.value }}";
        const transformed = parseSource(refs, bindings);
        expect(bindings.size).toBe(1);
        expect(bindings.has('myRef')).toBe(false);
        expect(transformed).toBe(
            "{{ this.refs.myRef.value === this.refs.myRef2.value + this.refs.myRef3.value }}"
        );
    });

    it('forces mount binding when refs are used in inline callbacks', () => {
        const src = `() => el => #:button.focus()`;
        const bindings = new Set();

        const out = parseSource(src, bindings);

        expect(out).toBe(
            `() => el => this.refs.button.focus()`
        );

        expect(bindings.has('lifecycle:mount')).toBe(true);
        expect(bindings.size).toBe(1);
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
        div.innerHTML = '<div *if="{{ watched:test }}"></div>';
        single = div.firstElementChild;
        div.innerHTML = `
            <div 
                *if="{{ watched:test }}"
                *for="{{ item of list }}"
                enso-if="{{ watched:test2 }}"
            >
            </div>`;
        multi = div.firstElementChild;
    });

    it('handles no directives', () => {
        expect(getOperator(noDir),'*if','enso-if').toBeNull();
        expect(getOperator(null)).toBeNull();
    });

    it('Handles single directives', () => {
        const dir = getOperator(single,'*if','enso-if');
        expect(dir).not.toBeNull();
        expect(dir).toBeDefined();
        // Correct attribute returned
        expect(dir).toBe('{{ watched:test }}');
    });

    it('handles multiple directives', () => {
        const dir = getOperator(multi,'*if','enso-if');
        expect(dir).not.toBeNull();
        expect(dir).toBeDefined();
        // Correct attribute returned
        expect(dir).toBe('{{ watched:test }}');
    });

});