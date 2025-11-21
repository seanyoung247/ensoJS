
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect } from 'vitest';
import { 
    createFragment,
    createTemplate, 
    cloneTemplate,
    getChildIndex, 
    createWalker 
} from '../../src/utils/dom'; 

describe('createFragment', () => {
    it('creates a DocumentFragment from an HTML string', () => {
        const html = '<div class="test">Hello, World!</div>';
        const fragment = createFragment(html);
        expect(fragment).toBeInstanceOf(DocumentFragment);
        expect(fragment.children.length).toBe(1);
        expect(fragment.children[0].outerHTML).toBe('<div class="test">Hello, World!</div>');
    });
});

describe('createTemplate', () => {
    it('returns the same template if input is an HTMLTemplateElement', () => {
        const template = document.createElement('template');
        template.innerHTML = '<span>Test</span>';
        const result = createTemplate(template);
        expect(result).toBe(template);
    });

    it('creates a template from an HTML string', () => {
        const html = '<p>Paragraph</p>';
        const template = createTemplate(html);
        expect(template).toBeInstanceOf(HTMLTemplateElement);
        expect(template.content.children.length).toBe(1);
        expect(template.content.children[0].outerHTML).toBe('<p>Paragraph</p>');
    });

    it('creates a template from a DocumentFragment', () => {
        const fragment = document.createDocumentFragment();
        const div = document.createElement('div');
        div.textContent = 'Content';
        fragment.appendChild(div);
        const template = createTemplate(fragment);
        expect(template).toBeInstanceOf(HTMLTemplateElement);
        expect(template.content.children.length).toBe(1);
        expect(template.content.children[0].outerHTML).toBe('<div>Content</div>');
    });
});

describe('getChildIndex', () => {
    it('returns the correct index of a child node', () => {
        const parent = document.createElement('div');
        const child1 = document.createElement('span');
        const child2 = document.createElement('a');
        parent.appendChild(child1);
        parent.appendChild(child2);
        expect(getChildIndex(parent, child1)).toBe(0);
        expect(getChildIndex(parent, child2)).toBe(1);
    });

    it('returns -1 if the node is not a child of the parent', () => {
        const parent = document.createElement('div');
        const child = document.createElement('span');
        expect(getChildIndex(parent, child)).toBe(-1);
    });
});

describe('createWalker', () => {
    it('creates a TreeWalker and traverses nodes correctly', () => {
        const root = document.createElement('div');
        const textNode = document.createTextNode('Text');
        const elemNode = document.createElement('p');
        root.appendChild(textNode);
        root.appendChild(elemNode);

        const walker = createWalker(root, NodeFilter.SHOW_ALL, null);
        expect(walker.currentNode).toBe(root);

        walker.nextNode();
        expect(walker.currentNode).toBe(textNode);

        walker.nextNode();
        expect(walker.currentNode).toBe(elemNode);

        expect(walker.nextNode()).toBeNull();
    });

    it('uses acceptNode function to filter nodes', () => {
        const root = document.createElement('div');
        const textNode1 = document.createTextNode('Text1');
        const elemNode = document.createElement('p');
        const textNode2 = document.createTextNode('Text2');
        root.appendChild(textNode1);
        root.appendChild(elemNode);
        root.appendChild(textNode2);

        const acceptNode = node => 
            (node.nodeType === Node.TEXT_NODE && node.textContent === 'Text2') ? 
            NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;

        const walker = createWalker(root, NodeFilter.SHOW_ALL, acceptNode);
        expect(walker.nextNode()).toBe(textNode2);
        expect(walker.nextNode()).toBeNull();
    });

    it('gracefully handles null or undefined acceptNode', () => {
        const root = document.createElement('div');
        const child = document.createElement('span');
        root.appendChild(child);

        // Should not throw when acceptNode is null
        expect(() => createWalker(root, NodeFilter.SHOW_ELEMENT, null)).not.toThrow();

        // Should not throw when acceptNode is undefined
        expect(() => createWalker(root, NodeFilter.SHOW_ELEMENT, undefined)).not.toThrow();

        const walker = createWalker(root, NodeFilter.SHOW_ELEMENT);
        expect(walker.currentNode).toBe(root);
        expect(walker.nextNode()).toBe(child);
        expect(walker.nextNode()).toBeNull();
    });
});

describe('cloneTemplate', () => {
    it('creates a deep clone of the template content', () => {
        const template = document.createElement('template');
        template.innerHTML = `
            <div class="outer">
                <span class="inner">Hello</span>
            </div>
        `;

        const cloned = cloneTemplate(template);

        // Should be an HTMLTemplateElement
        expect(cloned).toBeInstanceOf(HTMLTemplateElement);

        // Different nodes, same structure/content
        const originalDiv = template.content.querySelector('.outer');
        const clonedDiv = cloned.content.querySelector('.outer');

        expect(clonedDiv).not.toBe(originalDiv);
        expect(clonedDiv.innerHTML.trim()).toBe(originalDiv.innerHTML.trim());
    });

    it('produces a clone independent of later changes to the original', () => {
        const template = document.createElement('template');
        template.innerHTML = `<p id="tgt">Original</p>`;

        const cloned = cloneTemplate(template);
        const clonedP = cloned.content.querySelector('#tgt');

        // NOW modify the original
        template.content.querySelector('#tgt').textContent = 'Modified';

        // Clone should remain unchanged
        expect(clonedP.textContent).toBe('Original');
    });

    it('passes a DocumentFragment clone to createTemplate()', () => {
        const template = document.createElement('template');
        template.innerHTML = `<span>Test</span>`;

        const cloned = cloneTemplate(template);

        // cloneTemplate always returns createTemplate(DocumentFragment)
        expect(cloned).toBeInstanceOf(HTMLTemplateElement);

        const span = cloned.content.querySelector('span');
        expect(span).toBeTruthy();
        expect(span.textContent).toBe('Test');
    });

    it('handles empty templates correctly', () => {
        const template = document.createElement('template');

        const cloned = cloneTemplate(template);

        expect(cloned).toBeInstanceOf(HTMLTemplateElement);
        expect(cloned.content.childNodes.length).toBe(0);
    });
});
