
import { bench } from 'vitest';
import Enso, { html } from '../../src';


let counter = 0;
bench('Component definition', () => {
    Enso.component(`enso-basic-bench-${counter++}`, {
        template: html`<div>Hello World</div>`
    });
});


Enso.component('enso-basic-mount', {
    template: html`<div>Mounted!</div>`
});

bench('Basic component Mount', () => {
    document.body.append(
        document.createElement('enso-basic-mount')
    );
});


bench('Mount 1000 basic components', () => {
    const root = document.createElement('div');
    for (let i = 0; i < 1000; i++) {
        root.append(document.createElement('enso-basic-mount'));
    }
    document.body.append(root);
});

bench('Mount and Unmount 1000 basic components', () => {
    const root = document.createElement('div');
    for (let i = 0; i < 1000; i++) {
        root.append(document.createElement('enso-basic-mount'));
    }
    document.body.append(root);
    root.remove();
});