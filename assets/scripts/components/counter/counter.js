
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
        <span 
            :style="{{ this.count < 0 && 'text-decoration:line-through red' }}" 
            :class="display{{ (this.count > 9) && ' red' }}{{ this.underline(5) }}">

            {{ this.count }}
        </span>
        <button @click="this.inc">+</button>`,

    component: {
        count: 0,

        inc() { this.count++; },
        underline(amount) { return this.count > amount ? ' underline' : ''; },

        set thing(val) {this.count = val;},
        get thing() { return this.count;}
    }
});