
import Enso, { html, css, cssObj } from "enso";

Enso.component( "enso-app", {

    properties: {
        flag: { value: false }
    },

    expose: { cssObj },

    styles: css`${cssObj({
        div: {
            display: 'flex',
            flexDirection: 'column',
            "align-items": 'center',
            justifyContent: 'space-evenly',
            border: '1px solid black',
            height: '100vh',
        },
        '*': {
            boxSizing: 'border-box',
            padding: 0,
            margin: 0
        }
    })}`,

    template: html`
        <style>
            {{cssObj({
                div: {
                    backgroundColor: this.flag ? 'red' : 'green',
                    color: 'white'
                }
            }) }}
        </style>
        <div @click="()=>{this.flag = !this.flag}"
            :style="{{cssObj({fontWeight:this.flag && 'bold'})}}">
            Enso app
            <span>Content</span>
            Hello {{ this.flag ? 'You' : 'World' }}
        </div>
    `
});
