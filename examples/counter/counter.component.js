
import Enso, { css, html, attr } from 'enso';
import { load } from 'enso/helpers';

const [reset] = await load(import.meta.url, { file:'../assets/reset.css', as: css });

Enso.component('enso-counter', {
    watched: {
        count: attr(0)
    },
    styles: [reset, css`
        div {
            display: flex;
            justify-content: space-between;
            padding: 2px;
            border-radius: 12px / 50%;
            border: 1px solid black;
            width: 100%;
        }
        button {
            color: lightgrey;
            background-color: grey;
            border-radius: 50%;
            border: none;
            width: 20px;
            aspect-ratio: 1;
            &:hover {
                cursor: pointer;
                opacity: 0.75;
            }
            &:active {
                color: grey;
                background-color: lightgrey;
            }
        }
    `],
    template: html`
        <div>
            <button @click="this.dec">-</button>
                <span>{{ @:count }}</span>
            <button @click="this.inc">+</button>
        </div>
    `,
    script: {
        get count() { return this.watched.count; },
        set count(val) { this.watched.count = val; },

        inc() { this.watched.count++; },
        dec() { this.watched.count--; },
        reset() { this.watched.count = 0; },
    }
});
