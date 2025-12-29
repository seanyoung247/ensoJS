
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeAll } from 'vitest';
import { 
    ENSO_NODE, ENSO_ROOT,
    ADD_CHILD, BINDINGS, ENV,
    GET_BINDING, SCHEDULE_EFFECT,
    UPDATE,
    ADD_BINDING,
} from '../../../src/core/symbols.js';
import { UUIDRegEx } from '../../shared.js';

import EnsoTemplate from '../../../src/templates/template.js';
import { lifecycle } from '../../../src/component.js';


const getWatchedNodeElement = node => (
    (node.nodeType === Node.TEXT_NODE) ?
        node.parentElement : node
);
const isValid = v => !(v === true || v === false || v === null || v === undefined);
const parse = (strings, ...values) => {
    let isBool = false;
    const str = strings.reduce((a,c,i) => {
        const value = values[i];
        if (value === true) isBool = true;
        return a + c + (isValid(value) ? value : '');
    }, '');
    return (isBool && !str) ? true : str;
};

class MockComponent {
    // Watched props mocks
    watched = {
        isVisible: true,
        childIsVisible: false,
        isActive: true,
        name: 'World'
    };
    // Component Prop mocks
    children = [];
    refs = {};
    root = null;
    [ENV] = { parse };
    [BINDINGS] = new Map();

    constructor(){
        this[BINDINGS].set('isVisible', { changed: true, effects: [] });
        this[BINDINGS].set('childIsVisible', {changed: true, effects: [] });
        this[BINDINGS].set('isActive', { changed: true, effects: [] });
        this[BINDINGS].set('name', { changed: true, effects: [] });
        this[BINDINGS].set(lifecycle.mount, { changed: true, effects: [] });
    }

    get component() { return this; }
    get isAttached() { return true; }
    get isComponent() { return true; }

    [ADD_CHILD](child) {
        this.children.push(child);
    }

    [GET_BINDING](bind) { return this[BINDINGS].get(bind); }
    [ADD_BINDING](bind, effect) { this[BINDINGS].get(bind).effects.push(effect); }

    [SCHEDULE_EFFECT](effect) {
        effect.changed = true;
    }

    mount(template) {
        this.root = document.createDocumentFragment();
        this.root.append(template.process(this));
    }

    render() {
        for (const {effects} of this[BINDINGS].values()) {
            for (const effect of effects) {
                effect.run();
            }
        }
        for (const child of this.children) {
            child[UPDATE]();
        }
    }

}

describe('Template System', () => {

    let template, component, html;
    beforeAll(() => {
        html = /*html*/ 
            `<div id="if-parent" *if="{{ watched:isVisible === true}}">
                Hello {{ watched:name }}!
                <span id="noRef" #ref="noRef"></span>
                <div id="if-child" #ref="anotherRef" *if="{{ watched:childIsVisible }}">
                    Child Content
                </div>
                <div id="unwatched-1">No Template Directives</div>
            </div>
            <button id="test-btn" @click="()=>watched:childIsVisible = !watched:childIsVisible">
                Test Button
            </button>
            <div id="active" #ref="myRef"
                :class="{{ watched:name }}" 
                :data-active="{{ watched:isActive ? 'True' : 'False' }}"
            >
                Active Content: {{ watched:isActive ? 'True' : 'False' }}
                <div id="unwatched-2">No Template Directives</div>
            </div>
            <div id="unwatched-3">No Template Directives</div>`;
        
        component = new MockComponent();
    });

    it('initializes and preprocesses templates correctly', () => {
        template = new EnsoTemplate(html);
        const nodes = template.template.content;
        const ifParent = nodes.querySelector('#if-parent');
        const ifPlaceholder = nodes.querySelector(`template[${ENSO_NODE}]`);
        const ifChild = nodes.querySelector('#if-child');
        const active = nodes.querySelector('#active');
        const unwatched2 = nodes.querySelector('#unwatched-2');
        const unwatched3 = nodes.querySelector('#unwatched-3');

        const IfDef = template.watchedNodes.getByNode(ifPlaceholder);

        // Template should have removed if nodes and placed them in a fragment
        expect(ifParent).toBeNull();
        expect(ifChild).toBeNull();
        // Template should have placed a placeholder for the if parent
        expect(ifPlaceholder).toBeDefined();
        expect(ifPlaceholder.hasAttribute(ENSO_NODE)).toBe(true);
        expect(ifPlaceholder.getAttribute(ENSO_NODE)).toMatch(UUIDRegEx);

        // Template should preprocess and parse all the nodes with template directives
        expect(active.hasAttribute(ENSO_NODE)).toBe(true);
        expect(active.hasAttribute(ENSO_ROOT)).toBe(false);

        // Template should not modify nodes without template directives
        expect(unwatched2.hasAttribute(ENSO_NODE)).toBe(false);
        expect(unwatched2.hasAttribute(ENSO_ROOT)).toBe(false);
        expect(unwatched3.hasAttribute(ENSO_NODE)).toBe(false);
        expect(unwatched3.hasAttribute(ENSO_ROOT)).toBe(false);

        // Template should track all the watched nodes
        // ifParent + placeholder, ifChild + placeholder, button, active, ref
        expect(template.watchedNodes.size).toBe(7);
        // Ensure all watched nodes are correctly bound and targeted
        for (const def of template.watchedNodes) {
            const node = getWatchedNodeElement(def.node);
            expect(node).toBeDefined();
            expect(node.getAttribute(ENSO_NODE)).toBe(def.id);
        }
        // Template should generate fragments
        expect(IfDef).not.toBe(null);
        expect(IfDef.directive.template).not.toBe(template);
        expect(IfDef.directive.template).toBeInstanceOf(EnsoTemplate);
    });

    it('processes templates correctly', () => {
        // Initialise mock component with preprocessed template:
        component.mount(template);
        // simulate an intial component render
        component.render();

        // Check fragments/IF rendering
        const ifParent = component.root.getElementById("if-parent");
        const ifChild = component.root.getElementById('if-child');
        expect(ifParent).not.toBeNull();
        expect(ifChild).toBeNull();

        // Have Text nodes been initialised?
        const active = component.root.getElementById('active');
        expect(active.childNodes[0].textContent).toBe('Active Content: True');

        // Have bound attributes been setup
        expect(active.hasAttribute('data-active')).toBe(true);
        expect(active.getAttribute('data-active')).toBe('True');
        expect(active.hasAttribute('class')).toBe(true);
        expect(active.getAttribute('class')).toContain('World');

        // Have event handlers been attached
        const button = component.root.getElementById("test-btn");
        expect(component.watched.childIsVisible).toBe(false);
        button.click();
        expect(component.watched.childIsVisible).toBe(true);

        // Have references been setup
        expect(component.refs.myRef).toBeDefined();
        expect(component.refs.myRef.id).toBe('active');
    });

    it('clone() returns a fresh EnsoTemplate instance', () => {
        const cloned = template.clone();
        expect(cloned).toBeInstanceOf(EnsoTemplate);
        expect(cloned.template).not.toBe(template.template);
        expect(cloned.template.innerHTML).toBe(template.template.innerHTML);
    });

    it("extractLooseFragments handles parentless fragment node", () => {
        const tpl = new EnsoTemplate("<div></div>");
        const root = tpl.template.content;

        // Create an orphan <enso-fragment>
        const orphan = root.ownerDocument.createElement("enso-fragment");

        // Monkey-patch querySelectorAll for this one call
        const originalQS = root.querySelectorAll;
        root.querySelectorAll = () => [ orphan ];

        // Trigger fragment processing again (clone calls #fragment internally)
        tpl.clone();

        // Restore
        root.querySelectorAll = originalQS;

        expect(true).toBe(true); // Just "didn't throw"
    });

    it("extractLooseFragments removes empty enso-fragment nodes", () => {
        const tpl = new EnsoTemplate(`
            <div>
                <enso-fragment></enso-fragment>
            </div>
        `);

        const dom = tpl.process(null);

        expect(dom.querySelector(`enso-fragment:not([${ENSO_ROOT}])`)).toBeNull();
    });

    it("does not double-wrap an existing <enso-fragment> root", () => {
        const html = `
            <enso-fragment>
                <div>Test</div>
            </enso-fragment>
        `;

        const template = new EnsoTemplate(html);

        // template.template should be the existing wrapper, not wrapped again
        const root = template.template.content.firstElementChild;

        expect(root.tagName.toLowerCase()).toBe("enso-fragment");
        expect(root.childElementCount).toBe(1);
        expect(root.firstElementChild.tagName).toBe("DIV");
    });
});
