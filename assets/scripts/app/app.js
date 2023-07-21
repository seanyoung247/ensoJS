
import Enso, { html, css } from "enso";

Enso.component( "enso-app", {

    properties: {
        flag: { value: false }
    },

    template: html`
        <style>
            div {
                background: {{ this.flag ? 'red' : 'green' }};
                color: white;
            }
        </style>
        <div>
            Hello World
        </div>
    `
});