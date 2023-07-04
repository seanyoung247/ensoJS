
import Enso from "../enso/enso.js";

Enso.component({

    tag: 'enso-counter',

    properties: {
        count: { value: 0, attribute: { type: Number, force: true } }
    },

    styles:`
        .container { display: flex; }
        .display { flex-grow: 2; text-align: center; }`,

    template:
        `<div class="container">
            <button @click="()=>this.count--;">-</button>
            <span class="display">{{ this.count }}</span>
            <button @click="()=>this.count++;">+</button>
        </div>`

});