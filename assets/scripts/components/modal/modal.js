
import Enso, { load } from "../enso-old/enso.js";

const [template, styles] = await load.external(import.meta.url, 'modal.html', 'modal.css');


Enso.define({

    tagName: 'modal-dialog',
    component: 
    class extends Enso {
        static get _attributes() {
            return {
                'show': {type: Boolean, default: false},    // Is the modal shown?
                'static': {type: Boolean, default: false}   // Does clicking outside the modal close it?
            }
        }
    },
    template, styles
    
});