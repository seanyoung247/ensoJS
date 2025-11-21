
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import { NodeDef, NodeDefMap } from '../../src/templates/nodedef.js';
import { ENSO_NODE, ENSO_ROOT } from '../../src/core/symbols.js';

describe('NodeDef', () => {
    let node, map, def, parser;
    beforeEach(() => {
        node = document.createElement('div');
        map = new NodeDefMap();
        def = new NodeDef('testnode', node, map);

        parser = {
            type: 'test',
            match() { return true; },
            preprocess() { return true;},
            process() { return true; }
        };
    });

    it('creates a NodeDef with the correct properties', () => {
        expect(def.id).toBe('testnode');
        expect(def.node).toBeInstanceOf(HTMLElement);
        expect(def.node).toBe(node);
        expect(def.map).toBe(map);
    });

    it('adds refs correctly', () => {
        def.ref = 'myRef';
        expect(def.ref).toBe('myRef');
        expect(node.hasAttribute(ENSO_NODE)).toBe(true);
    });

    it('adds events correctly', () => {
        def.addEvent('click', () => {});
        expect(def.events.length).toBe(1);
        expect(def.events[0].name).toBe('click');
        expect(node.hasAttribute(ENSO_NODE)).toBe(true);
    });

    it('adds attributes correctly', () => {
        def.addAttribute('class', ()=>{}, new Set(['bind1']));
        expect(def.attributes.length).toBe(1);
        expect(def.attributes[0].name).toBe('class');
        expect(def.attributes[0].binds.has('bind1')).toBe(true);
        expect(node.hasAttribute(ENSO_NODE)).toBe(true);
    });

    it('adds content mutations correctly', () => {
        def.addContent(null, 1, ()=>{}, new Set(['bind1']));
        expect(def.content.length).toBe(1);
        expect(def.content[0].index).toBe(1);
        expect(def.content[0].binds.has('bind1')).toBe(true);
        expect(node.hasAttribute(ENSO_NODE)).toBe(true);
    });

    it('adds directives correctly', () => {
        def.setDirective({
            type:'if', template:null, effect:()=>{}, binds:new Set(['bind1'])
        });
        expect(def.directive.type).toBe('if');
        expect(def.directive.binds.has('bind1')).toBe(true);
        expect(node.hasAttribute(ENSO_NODE)).toBe(false);
        expect(node.hasAttribute(ENSO_ROOT)).toBe(false);
        
        def.setDirective({
            type:'if', template:null, binds:new Set(['bind1'])
        });
        expect(def.directive.type).toBe('if');
        expect(def.directive.binds.has('bind1')).toBe(true);
        expect(node.hasAttribute(ENSO_NODE)).toBe(false);
        expect(node.hasAttribute(ENSO_ROOT)).toBe(false);
    });

    it('accepts partial directives', () => {
        def.setDirective({ type:'custom' });
        expect(def.directive.type).toBe('custom');
        expect(def.directive.binds).toBeUndefined();
        expect(node.hasAttribute(ENSO_NODE)).toBe(false);
        expect(node.hasAttribute(ENSO_ROOT)).toBe(false);
        def.setDirective({ action: ()=>{} });
        expect(def.directive.type).toBe('custom');
        expect(def.directive.action).toBeInstanceOf(Function);      
    });

    it('attaches parsers correctly', () => {
        def.attachParser(parser);
        expect(def.parsers.has(parser)).toBe(true);
    });
    
    it('can handle multiple parsers', () => {
        const parser2 = { ...parser, type: 'test2' };
        def.attachParser(parser);
        def.attachParser(parser2);
        expect(def.parsers.has(parser)).toBe(true);
        expect(def.parsers.has(parser2)).toBe(true);
    });

    it('marks node as watched when ref, event, attribute, or content is added', () => {
        expect(node.hasAttribute(ENSO_NODE)).toBe(false);
        def.ref = 'myRef';
        expect(node.hasAttribute(ENSO_NODE)).toBe(true);

        const node2 = document.createElement('div');
        const def2 = new NodeDef('testnode2', node2, map);
        expect(node2.hasAttribute(ENSO_NODE)).toBe(false);
        def2.addEvent('click', () => {});
        expect(node2.hasAttribute(ENSO_NODE)).toBe(true);

        const node3 = document.createElement('div');
        const def3 = new NodeDef('testnode3', node3, map);
        expect(node3.hasAttribute(ENSO_NODE)).toBe(false);
        def3.addAttribute('class', ()=>{}, new Set(['bind1']));
        expect(node3.hasAttribute(ENSO_NODE)).toBe(true);

        const node4 = document.createElement('div');
        const def4 = new NodeDef('testnode4', node4, map);
        expect(node4.hasAttribute(ENSO_NODE)).toBe(false);
        def4.addContent(null, 1, ()=>{}, new Set(['bind1']));
        expect(node4.hasAttribute(ENSO_NODE)).toBe(true);
    });

    it('can mark node as root', () => {
        expect(node.hasAttribute(ENSO_ROOT)).toBe(false);
        def.markRoot();
        expect(node.hasAttribute(ENSO_ROOT)).toBe(true);
        expect(node.getAttribute(ENSO_ROOT)).toBe('');
        def.markRoot(true);
        expect(node.hasAttribute(ENSO_ROOT)).toBe(true);
        expect(node.getAttribute(ENSO_ROOT)).toBe(def.id);
    });

    it('can remove root marking', () => {
        expect(node.hasAttribute(ENSO_ROOT)).toBe(false);
        def.markRoot();
        expect(node.hasAttribute(ENSO_ROOT)).toBe(true);
        def.unRoot();
        expect(node.hasAttribute(ENSO_ROOT)).toBe(false);
    });

    it('can identify if node is root', () => {
        expect(def.isRoot()).toBe(false);
        def.markRoot();
        expect(def.isRoot()).toBe(true);
    });

    it('can mark node as watched', () => {
        expect(node.hasAttribute(ENSO_NODE)).toBe(false);
        def.markWatched();
        expect(node.hasAttribute(ENSO_NODE)).toBe(true);
        expect(node.getAttribute(ENSO_NODE)).toBe(def.id);
    });

    it('can remove watched marking', () => {
        expect(node.hasAttribute(ENSO_NODE)).toBe(false);
        def.markWatched();
        expect(node.hasAttribute(ENSO_NODE)).toBe(true);
        def.unWatch();
        expect(node.hasAttribute(ENSO_NODE)).toBe(false);
    });

    it('can identify if node is watched', () => {
        expect(def.isWatched()).toBe(false);
        def.markWatched();
        expect(def.isWatched()).toBe(true);
    });

    it('can replace node and retain watched status', () => {
        const newNode = document.createElement('span');
        expect(node.hasAttribute(ENSO_NODE)).toBe(false);
        def.markWatched();
        expect(node.hasAttribute(ENSO_NODE)).toBe(true);
        const original = def.replaceNode(newNode);
        expect(original).toBe(node);
        expect(def.node).toBe(newNode);
        expect(newNode.hasAttribute(ENSO_NODE)).toBe(true);
        expect(newNode.getAttribute(ENSO_NODE)).toBe(def.id);
    });
});

