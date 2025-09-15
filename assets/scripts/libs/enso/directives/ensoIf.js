
import Enso from "../component.js";
import { html, css } from "../enso.js";

Enso.component('enso-if', {

    useShadow: false,

    styles: css`
        :host { display: contents; }
        :host([hidden]) { display: none; }
    `,

    template: html`<slot></slot>`,

    component: {
        onStart() {
            console.log("enso-if started");
        },
        preUpdate() {
            console.log("enso-if preUpdate");
        }
    },


});
