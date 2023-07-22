
import Enso, { html, css, style } from "enso";

Enso.component( "enso-app", {

    properties: {
        flag: { value: false }
    },

    expose: { style },

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
        <style>{{
            style({
                div: {
                    backgroundColor: this.flag ? 'red' : 'green',
                    color: 'white'
                }
            }) }}
        </style>
        <div @click="()=>{this.flag = !this.flag}">
            Enso app
            <span>Content</span>
            Hello {{ this.flag ? 'You' : 'World' }}
        </div>
    `
});
