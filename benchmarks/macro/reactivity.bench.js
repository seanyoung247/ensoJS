
import { bench } from 'vitest';
import { flushRAF } from '../shared';
import Enso, { html, prop } from '../../src';


Enso.component('enso-reactive-text', {
    watched: {
        value: prop(0)
    },
    template: html`
        <p>${Array.from({length:50},()=>`<p>{{@:value}}</p>`)}</p>
    `,
});


let el;
bench('Create 50 text nodes (baseline)', () => {
    const root = document.createElement('div');
    for (let i = 0; i < 50; i++) {
        const p = document.createElement('p');
        p.textContent = "0";
        root.append(p);
    }
});

bench('Mount component with 50 reactive text bindings', () => {
    el = document.createElement('enso-reactive-text');
    document.body.append(el);
});

bench('React to altered watched property with 50 text bindings', () => {
    el.watched.value = 5;
    flushRAF();
});

bench('Batched writes to watched property with 50 text bindings', () => {
    for (let i = 0; i < 100; i++) {
        el.watched.value = Math.random() * 100;
    }
    flushRAF();
});
