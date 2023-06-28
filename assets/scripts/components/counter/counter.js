
import Enso from "../enso/enso.js";

Enso.component({

    tag: 'enso-counter',

    attributes: {
        count: { type: Number, default: 0, show: true }
    },

    watched: ['count'],

    styles:`
        .container { display: flex; }
        .display { flex-grow: 2; text-align: center; }`,

    template:
        `<div class="container">
            <button @click="()=>this.count--">-</button>
            <div class="display">{{ this.count }}</div>
            <button @click="()=>this.count++">+</button>
        </div>`

});