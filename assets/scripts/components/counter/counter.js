
import Enso from "../enso/enso.js";

Enso.component({

    tag: 'enso-counter',

    properties: {
        count: { value: 0, attribute: { type: Number, force: true } }
    },

    styles:`
        :host { display: flex; }
        .red { color: red; }
        .display { flex-grow: 2; text-align: center; }`,

    template:
        `<button @click="()=>this.count--">-</button>
        <span 
            :style="{{ this.count < 0 && 'text-decoration:line-through red' }}" 
            :class="display{{ (this.count > 9) && ' red' }}">

            {{ this.count }}
        </span>
        <button @click="this.inc">+</button>`

    },
    class extends Enso {
        inc() {
            this.count++;
        }
    }
);