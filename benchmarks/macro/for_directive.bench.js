
import { bench } from 'vitest';
import { flushRAF } from '../shared';
import Enso, { html, prop } from '../../src';


Enso.component('enso-for-100', {
    watched: {
        list: prop(Array.from({ length: 100 }, (_, i) => i), true)
    },
    template: html`
        <div>
            <div *for="item of @:list">{{ item }}</div>
        </div>
    `
});


let el;
bench('FOR: render 100 items', () => {
    el = document.createElement('enso-for-100');
    document.body.append(el);
});


bench('FOR: update 100 items', () => {
    el.watched.list = Array.from({ length: 100 }, () => Math.random());
    flushRAF();
});


bench('FOR: mutate 1 item in 100', () => {
    const list = el.watched.list.slice();
    list[50] = Math.random(); // simple replacement
    el.watched.list = list;
    flushRAF();
});


bench('FOR: teardown 100 items', () => {
    el.remove();
});
