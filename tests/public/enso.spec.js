
import { it, expect, beforeAll } from 'vitest';
import { testMode } from '../shared.js';


let Enso;
beforeAll(async () => {
  const mod = await testMode.importModule();
  ({ default: Enso } = mod);
});

it ('returns a component tag with correct properties', async () => {
    const config = {template: '<div></div>'};
    const componentTag = Enso.component('my-test', config);
    // Base Properties
    expect(componentTag.tag).toBe('my-test');
    expect(typeof componentTag.Class).toBe('function');
    expect(Object.getPrototypeOf(componentTag.Class.prototype))
        .toBeInstanceOf(HTMLElement);

    // HTML template generation 
    expect(componentTag.html.toString()).toBe('<my-test></my-test>');
    expect(`${componentTag.html}`).toBe('<my-test></my-test>');
    expect(`${componentTag.html(null, '<test>Hello World</test>')}`)
        .toBe('<my-test><test>Hello World</test></my-test>');
    expect(`${componentTag.html({ id: 'comp1', hidden: true })}`)
        .toBe('<my-test id="comp1" hidden></my-test>');
    expect(`${componentTag.html({ id: 'comp1', omit1: null, omit2: false })}`)
        .toBe('<my-test id="comp1"></my-test>');
    expect(`${componentTag.html({ id: 'comp1', hidden: true },'<span>Content</span>')}`)
        .toBe('<my-test id="comp1" hidden><span>Content</span></my-test>');

    // Live Component Element creation
    const el = componentTag({'test': 'test_value'}, `Hello World`);
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.tagName.toLowerCase()).toBe('my-test');
    expect(el.hasAttribute('test')).toBe(true);
    expect(el.getAttribute('test')).toBe('test_value');
    expect(el.textContent).toBe('Hello World');
});

it('define creates a component class without registering it', () => {
    const tag = 'enso-define-test';

    const ComponentClass = Enso.define({
        template: '<div></div>'
    });

    expect(typeof ComponentClass).toBe('function');
    expect(Object.getPrototypeOf(ComponentClass.prototype))
        .toBeInstanceOf(HTMLElement);

    expect(customElements.get(tag)).toBeUndefined();
});