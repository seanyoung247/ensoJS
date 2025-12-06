
import { bench } from 'vitest';
import Enso, { html } from '../../src';

const bigTemplate = html`
    <div>
        ${Array.from({ length: 100 }, (_, i) => `<p>Line ${i}</p>`).join('')}
    </div>
`;

Enso.component('enso-large-template', {
    template: bigTemplate
});

bench('Mount large-template component (100 nodes)', () => {
    document.body.append(document.createElement('enso-large-template'));
});
