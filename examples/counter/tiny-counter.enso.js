
import Enso, { css, html, attr } from 'ensojs';

Enso.component('tiny-counter', {
    watched: { value: attr(0) },
    styles: css`:host{
        display:flex;
        justify-content:space-between;
    }`,
    template: html`
        <button @click="()=>@:value--">-</button>
        {{ @:value }}
        <button @click="()=>@:value++">+</button>
    `
});
