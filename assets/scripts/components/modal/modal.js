
import Enso, { load } from "enso";

const [template, styles] = await load.external(import.meta.url, 'modal.html', 'modal.css');

Enso.component(

    'enso-modal', {
    
    properties: {
        'show': { attribute: {type: Boolean}, value: false},    // Is the modal shown?
        'static': { attribute: {type: Boolean}, value: false}   // Does clicking outside the modal close it?
    },

    template, styles

});
