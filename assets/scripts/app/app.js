
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
            {{ this.flag ? 'App Enso' : 'Enso App' }}
            <span>Content</span>
            Hello {{ this.flag ? 'You' : 'World' }}
        </div>
    `,
    
    script: {
        onStart() {
            console.log("App connected");
        },
        preUpdate() {
            console.log("App preUpdate");
        },
        onPropertyChange() {
            console.log("App property changed");
        },
        postUpdate() {
            console.log("App postUpdate");
        },
        onRemoved() {
            console.log("App disconnected");
        }
    }
});
