
import { bench } from 'vitest';
import Enso, { html, watches } from '../../src';

Enso.component('enso-nested-component', {

    template: html`<div #ref="root"></div>`,
    script: {
        maxDepth: 3,
        setup: watches(function () {
            const depth = parseInt(this.getAttribute('depth') || 0);
            if (depth < this.maxDepth) {
                const child = document.createElement('enso-nested-component');
                child.setAttribute('depth', depth + 1);
                this.refs.root.append(
                    child
                );
            }
        }, ['lifecycle:mount'])
    }
});

bench('Mount nested component tree', () => {
    const el = document.createElement('enso-nested-component');
    document.body.append(el);
});

Enso.component('enso-deep-node', {
    template: html`<div #ref="slot"></div>`,
    script: {
        maxDepth: 20,
        setup: watches(function () {
            const depth = this.getAttribute('depth') | 0;

            if (depth < this.maxDepth) {
                const child = document.createElement('enso-deep-node');
                child.setAttribute('depth', depth + 1);
                this.refs.slot.append(child);
            }
        }, ['lifecycle:mount'])
    }
});

bench('Mount deep recursive tree (depth 20)', () => {
    const el = document.createElement('enso-deep-node');
    document.body.append(el);
});
