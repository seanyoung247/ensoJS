
import Enso, { html, css } from "enso";

function slotChange(e) {
    console.log(e.target.assignedElements());
}

Enso.component( 'enso-todo', {
    properties: {
        items: { value: [] }
    },

    expose: { slotChange },

    styles: css`
        slot#hidden {display: none;}
        ul {list-style: none; padding: 0;}
    `,

    template: html`
        <ul>
            <li>Test Items</li>
        </ul>
        <!--<div id="hidden">-->
        <slot id="hidden" @slotchange="slotChange"></slot>
    `,

})