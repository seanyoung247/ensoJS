
import Enso, { html, css, load, cssObj } from "enso";

const cssReset = await load.css('assets/styles/reset.css');

Enso.component( "enso-app", {

    properties: {
        flag: { value: false },
        showChild: { value: 'show' }
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
            },
            button: {
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: '#888',
            },
            ".if-test": {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid white',
                padding: '10px',
                margin: '10px',
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
            :style="{{ cssObj({fontWeight:this.flag && 'bold'}) }}">
            <button @click="()=>{ this.flag = !this.flag; }">Toggle Flag</button>
            {{ this.flag ? 'App Enso' : 'Enso App' }}

            <div *if="{{ this.flag }}" class="if-test">
                Content
                <div *if="{{ this.showChild === 'show' }}">Child Content</div>
                <button @click="this.childHide">Toggle Child</button>
            </div>
            <div *if="{{ !this.flag }}">No Content</div>

            Hello {{ this.flag ? 'You' : 'World' }}
        </div>
    `,

    script: {
        childHide() {
            this.showChild = (this.showChild === 'hide') ? 'show' : 'hide';
        }
    }
});
