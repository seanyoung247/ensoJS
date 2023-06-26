
import Enso from "../enso/enso.js";

Enso.component({

    tagName: 'enso-counter',

    attributes: {
        count: { type: Number, default: 0, show: true }
    },

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