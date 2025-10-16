
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeAll } from 'vitest';
import { 
    ENSO_NODE, ENSO_ROOT,
    ADD_CHILD, BINDINGS, ENV,
    GET_BINDING, SCHEDULE_EFFECT,
    UPDATE,
} from '../../src/core/symbols.js';
import { UUIDRegEx } from '../shared.js';

import EnsoTemplate from '../../src/templates/templates.js';
import { runEffect } from '../../src/core/effects.js';
import { parse } from '../../src/core/tags.js';


const getWatchedNodeElement = node => (
    (node.nodeType === Node.TEXT_NODE) ?
        node.parentElement : node
);

class MockComponent {
    // Watched props mocks
    isVisible = true;
    childIsVisible = false;
    isActive = true;
    name = 'World';
    // Component Prop mocks
    children = [];
    refs = {};
    root = null;
    [ENV] = {parse};
    [BINDINGS] = new Map();

    constructor(){
        this[BINDINGS].set('isVisible', { changed: true, effects: [] });
        this[BINDINGS].set('childIsVisible', {changed: true, effects: [] });
        this[BINDINGS].set('isActive', { changed: true, effects: [] });
        this[BINDINGS].set('name', { changed: true, effects: [] });
    }

    get component() { return this; }
    get isAttached() { return true; }

    [ADD_CHILD](child) {
        this.children.push(child);
    }

    [GET_BINDING](bind) { return this[BINDINGS].get(bind); }

    [SCHEDULE_EFFECT](effect) {
        effect.changed = true;
    }

    mount(template) {
        this.root = template.process(this);
    }

    render() {
        for (const {effects} of this[BINDINGS].values()) {
            for (const effect of effects) {
                runEffect(this, effect);
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
        html = 
            `<div id="if-parent" *if="{{ this.isVisible === true}}">
                Hello {{ this.name }}!
                <span id="ref" #ref="myRef"></span>
                <div id="if-child" #ref="anotherRef" *if="{{ this.childIsVisible }}">
                    Child Content
                </div>
                <div id="unwatched-1">No Template Directives</div>
            </div>
            <button id="test-btn" @click="()=>this.childIsVisible = !this.childIsVisible">
                Test Button
            </button>
            <div id="active" :class="{{ this.name }}" :data-active="{{ this.isActive ? 'True' : 'False' }}">
                Active Content: {{ this.isActive ? 'True' : 'False' }}
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
        expect(component.childIsVisible).toBe(false);
        button.click();
        expect(component.childIsVisible).toBe(true);

        // Have references been setup
        expect(component.refs.myRef).toBeDefined();
        expect(component.refs.myRef.id).toBe('ref');
    });
});
