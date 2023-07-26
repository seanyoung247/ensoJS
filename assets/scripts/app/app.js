
import Enso, { html, css, load, cssObj } from "enso";

const cssReset = await load.css('assets/styles/reset.css');

Enso.component( "enso-app", {

    properties: {
        flag: { value: false }
    },

    expose: { cssObj },

    styles: [
        cssReset,
        css`${cssObj({
            div: {
                display: 'flex',
                flexDirection: 'column',
                "align-items": 'center',
                justifyContent: 'space-evenly',
                border: '1px solid black',
                height: '100vh',
            }
        })}`
    ],

    template: html`
        <style>
            ${ cssObj({
                div: {
                    backgroundColor: "{{ this.flag ? 'red' : 'green' }}",
                    color: 'white',
                }
            }) }
        </style>
        <div @click="()=>{ this.flag = !this.flag }"
            :style="{{ cssObj({fontWeight:this.flag && 'bold'}) }}">
            Enso app
            <span>Content</span>
            Hello {{ this.flag ? 'You' : 'World' }}
        </div>
    `
});
