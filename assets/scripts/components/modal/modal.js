
import Enso, { load } from "../enso/enso.js";

const [template, styles] = await load.external(import.meta.url, 'modal.html', 'modal.css');

Enso.component({

    tag: 'enso-modal',
    
    attributes: {
        'show': {type: Boolean, value: false},      // Is the modal shown?
        'static': {type: Boolean, value: false}     // Does clicking outside the modal close it?
    },

    template, styles

});