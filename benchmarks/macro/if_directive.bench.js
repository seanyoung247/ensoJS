
import { bench } from 'vitest';
import { flushRAF } from '../shared';
import Enso, { html, prop } from '../../src';


Enso.component('enso-if-bench', {
    watched: {
        flag: prop(true)
    },
    template: html`
        <div *if="{{@:flag}}">
            Hello
        </div>
    `
});


let el;
bench('IF: mount and render', () => {
    el = document.createElement('enso-if-bench');
    document.body.append(el);
});

bench('IF: initial render (false)', () => {
    el.watched.flag = false;
    flushRAF();
});

bench('IF: false -> true', () => {
    el.watched.flag = true;
    flushRAF();
});

bench('IF: rapid toggling (100 flips)', () => {
    for (let i = 0; i < 100; i++) {
        el.watched.flag = !el.watched.flag;
    }
    flushRAF();
});
