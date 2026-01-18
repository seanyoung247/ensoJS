
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import { NodeDef, NodeDefMap } from '../../../src/templates/nodedef.js';
import { ENSO_NODE, ENSO_ROOT } from '../../../src/core/symbols.js';

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

