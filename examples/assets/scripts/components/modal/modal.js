
import Enso, { attr, load } from "enso";


const [template, styles] = await load.all(import.meta.resolve,
    './modal.html',
    './modal.css',
);

Enso.component('enso-modal', {
    watched: {
        show: attr(false),  // Is the modal shown?
        static: attr(false) // Does clicking outside the modal close it?
    },
    template, styles,
    script: {
        get static() { return this.watched.static; },
        set static(value) { this.watched.static = value; },
        show() {
            this.watched.show = true;
        },
        hide() {
            this.watched.show = false;
        }
    }
});
