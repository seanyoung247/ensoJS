
import { Enso, load } from "../enso/enso.js";

const[template, styles] = await load.htmlAndCss('modal.html', 'modal.css', import.meta.url);

Enso.define(
    class extends Enso {
        static get tagName() { return 'modal-dialog'; }
        static get _attributes() {
            return {
                'show': {type: Boolean, default: false},    // Is the modal shown?
                'static': {type: Boolean, default: false}   // Does clicking outside the modal close it?
            }
        }

        onStart() {
            this._refs.pane.onclick = e => e.stopPropagation();
            this._refs.container.onclick = () => this.show = this.static;
            this._refs['modal-close'].onclick = () => this.show = false;
        }

        onPropertyChange(prop, value) {
            if (prop === 'show' && value === false) {
                this.dispatchEvent(new Event('modal-closed', {bubbles: true}));
            }
        }
    },
    template, styles
    
);
