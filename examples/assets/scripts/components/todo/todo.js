
import Enso, { html, css } from "enso";

function slotChange(e) {
    console.log(e.target.assignedElements());
}

Enso.component( 'enso-todo', {
    watched: {
        items: { value: ['cheese', 'pork'] }
    },

    expose: { slotChange },

    styles: css`
        slot#hidden {display: none;}
        ul {list-style: none; padding: 0;}
    `,

    template: html`
        <ul>
            <li *for="item of @:items">{{ item }}</li>
        </ul>
    `,

});