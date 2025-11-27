
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnsoFragment } from '../../src/core/fragment.js';
import {
    ADD_CHILD, BINDINGS, ENV, UPDATE,
    SCHEDULE_UPDATE, NODES, ANCHOR,
} from '../../src/core/symbols.js';


describe('EnsoFragment', () => {

    let parent, template, placeholder, comp;

    beforeEach(() => {
        // Component mock
        comp = {
            [BINDINGS]: new Map([
                ['foo', { watchers: ['watch1'] }],
                ['bar', { watchers: [] }],
            ]),
            [SCHEDULE_UPDATE]: vi.fn()
        };

        parent = {
            component: comp,
            isAttached: true,
            [ENV]: { x: 1 },
            [ADD_CHILD]: vi.fn(),
            [UPDATE]: vi.fn()
        };

        placeholder = document.createElement('span');
        document.body.appendChild(placeholder);

        // Template mock
        template = {
            process: vi.fn().mockImplementation(() => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = `<p id="inside">Hello</p>`;
                return wrapper; // firstElementChild -> <p>
            })
        };
    });

    it('constructs and registers with parent', () => {
        const frag = new EnsoFragment(parent, template, placeholder);

        expect(parent[ADD_CHILD]).toHaveBeenCalledWith(frag);
        expect(template.process).toHaveBeenCalled();
        expect(frag.component).toBe(comp);
        expect(frag[ENV]).toEqual({ x: 1 });
    });

    it('replaces placeholder with comment anchor', () => {
        const frag = new EnsoFragment(parent, template, placeholder);

        const anchor = frag[ANCHOR];
        expect(anchor.nodeType).toBe(Node.COMMENT_NODE);

        expect(document.body.contains(placeholder)).toBe(false);
        expect(document.body.contains(anchor)).toBe(true);
    });

    it('stores processed nodes', () => {
        const frag = new EnsoFragment(parent, template, placeholder);
        const nodes = frag[NODES];

        expect(nodes.length).toBe(1);
        expect(nodes[0].id).toBe('inside');
    });

    it('unmount() removes all nodes and marks as detached', () => {
        const frag = new EnsoFragment(parent, template, placeholder);

        frag.mount();
        const nodes = [...frag[NODES]];

        frag.unmount();

        expect(frag.isAttached).toBe(false);

        for (const n of nodes) {
            expect(document.body.contains(n)).toBe(false);
        }
    });

});
