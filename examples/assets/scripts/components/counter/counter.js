
import Enso, {html, css, classList} from "enso";

Enso.component('enso-counter', {

    watched: {
        count: { value: 0, attribute: { type: Number, force: true } }
    },

    expose: { classList },

    styles: css`
        :host { display: flex; }
        .red { color: red; }
        .display { flex-grow: 2; text-align: center; }`,

    template: html`
        <button @click="()=>watched:count--">-</button>
        <span :class="{{ 
            classList('display', 
            (watched:count >= 10) && 'red') 
        }}">
            {{ watched:count }}
        </span>
        <button @click="()=>watched:count++">+</button>`,

});
