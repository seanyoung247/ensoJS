
import Enso, {html, css} from "../enso/enso.js";

Enso.component(
    
    'enso-counter', {

    properties: {
        count: { value: 0, attribute: { type: Number, force: true } }
    },

    styles: css`
        :host { display: flex; }
        .red { color: red; }
        .underline { text-decoration: underline; }
        .display { flex-grow: 2; text-align: center; }`,

    template: html`
        <button @click="()=>this.count--">-</button>
        <span class="display">
            {{ this.count }}
        </span>
        <button @click="()=>this.count++">+</button>`,
});