
import Enso, { html, css } from "enso";

Enso.component( "enso-app", {

    properties: {
        flag: { value: false }
    },

    styles: css`
        div { 
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1em;
            border: 1px solid black;
        }
    `,

    template: html`
        <style>
            div {
                background: {{ this.flag ? 'red' : 'green' }};
                color: white;
            }
        </style>
        <div @click="()=>{this.flag = !this.flag}">
            cheese
            <span></span>
            Hello {{ this.flag?'You':'World' }}
        </div>
    `
});