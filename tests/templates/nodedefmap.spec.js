
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { describe, it, expect, beforeEach } from 'vitest';
import { NodeDef, NodeDefMap } from '../../src/templates/nodedef.js';

describe('NodeDefMap', () => {
    let map;
    beforeEach(() => {
        map = new NodeDefMap();
    });

    it('adds nodeDefs', () => {
        map.add(new NodeDef('test1', document.createElement('div'), map));
        map.add(new NodeDef('test2', document.createElement('span'), map));
        expect(map.size).toBe(2);
    });

    it('retrieves nodeDefs by id', () => {
        const def1 = new NodeDef('test1', document.createElement('div'), map);
        const def2 = new NodeDef('test2', document.createElement('span'), map);
        map.add(def1);
        map.add(def2);
        expect(map.get('test1')).toBe(def1);
        expect(map.get('test2')).toBe(def2);
    });

    it('returns null for non-existent ids', () => {
        expect(map.get('nonexistent')).toBeNull();
    });

    it('does not add duplicate ids', () => {
        const def1 = new NodeDef('test1', document.createElement('div'), map);
        const def2 = new NodeDef('test1', document.createElement('span'), map);
        map.add(def1);
        map.add(def2);
        expect(map.size).toBe(1);
        expect(map.get('test1')).toBe(def1);
    });

    it('gets nodedefs by node tag', () => {
        const def1 = new NodeDef('test1', document.createElement('div'), map);
        const def2 = new NodeDef('test2', document.createElement('span'), map);
        const def3 = new NodeDef('test3', document.createElement('div'), map);
        def1.markWatched();
        def2.markWatched();
        def3.markWatched();

        map.add(def1);
        map.add(def2);
        map.add(def3);

        expect(map.getByNode(def1.node)).toBe(def1);
        expect(map.getByNode(def2.node)).toBe(def2);
        expect(map.getByNode(def3.node)).toBe(def3);
        expect(map.getByNode(document.createElement('a'))).toBeNull();
    });

    it('gets nodedefs by root tag', () => {
        const def1 = new NodeDef('test1', document.createElement('div'), map);
        const def2 = new NodeDef('test2', document.createElement('span'), map);
        const def3 = new NodeDef('test3', document.createElement('div'), map);
        def1.markRoot(true);
        def2.markRoot(true);
        def3.markRoot(true);
        map.add(def1);
        map.add(def2);
        map.add(def3);

        expect(map.getByRoot(def1.node)).toBe(def1);
        expect(map.getByRoot(def2.node)).toBe(def2);
        expect(map.getByRoot(def3.node)).toBe(def3);
        expect(map.getByRoot(document.createElement('a'))).toBeNull();
    });

    it('returns null when getting by node or root without appropriate attributes', () => {
        const def1 = new NodeDef('test1', document.createElement('div'), map);
        map.add(def1);
        expect(map.getByNode(def1.node)).toBeNull();
        expect(map.getByRoot(def1.node)).toBeNull();
    });

    it('size property reflects number of nodeDefs', () => {
        expect(map.size).toBe(0);
        map.add(new NodeDef('test1', document.createElement('div'), map));
        expect(map.size).toBe(1);
        map.add(new NodeDef('test2', document.createElement('span'), map));
        expect(map.size).toBe(2);
    });

    it('creates NodeDef for a node that is not marked as watched', () => {
        const node = document.createElement('div');
        const def = map.create(node);
        expect(def).toBeInstanceOf(NodeDef);
        expect(def.node).toBe(node);
        expect(def.isWatched()).toBe(false);
        expect(map.size).toBe(0); // Not added to map yet
    });
    
    it('returns existing NodeDef for a node that is already marked as watched', () => {
        const node = document.createElement('div');
        const def1 = new NodeDef('test1', node, map);
        def1.markWatched();
        map.add(def1);
        const def2 = map.create(node);
        expect(def2).toBe(def1);
        expect(map.size).toBe(1);
    });

    it('creates and adds a root NodeDef', () => {
        const node = document.createElement('div');
        const def = map.createRoot(node);
        expect(def).toBeInstanceOf(NodeDef);
        expect(def.node).toBe(node);
        expect(def.isRoot()).toBe(true);
        expect(map.size).toBe(1);
        expect(map.get(def.id)).toBe(def);
    });

    it('can be itererated over', () => {
        const def1 = new NodeDef('test1', document.createElement('div'), map);
        const def2 = new NodeDef('test2', document.createElement('span'), map);
        map.add(def1);
        map.add(def2);

        const defs = Array.from(map);
        expect(defs).toContain(def1);
        expect(defs).toContain(def2);
        expect(defs.length).toBe(2);
    });
});