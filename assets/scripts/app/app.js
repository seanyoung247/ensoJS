
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
            "#app-root": {
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
        <div id="app-root"
            @click="()=>{ this.flag = !this.flag; }"
            @mouseover="()=>{ console.log('hover'); }"
            :style="{{ cssObj({fontWeight:this.flag && 'bold'}) }}">
            {{ this.flag ? 'App Enso' : 'Enso App' }}

            <div *if="{{ this.flag }}">Content</div>
            <div *if="{{ !this.flag }}">!Content</div>

            Hello {{ this.flag ? 'You' : 'World' }}
        </div>
    `,
});
