
import { 
    WebComponent, createComponent, importTemplate, importStyles 
} from "../../gadget/gadget.js";

const styles = await importStyles('modal.css', import.meta.url);
const template = await importTemplate('modal.html', import.meta.url);

createComponent(

    class extends WebComponent {
        static get tagName() { return 'modal-dialog'; }
        static get _attributes() {
            return {
                'show': {type: Boolean, default: false},    // Is the modal shown?
                'static': {type: Boolean, default: false}   // Does clicking outside the modal close it?
            }
        }

        #container = null;
        #dialog = null;
        #closeBtn = null;

        constructor() {
            super();
            this._createShadowDOM();
            this.#container = this.getElement('#modal-container');
            this.#dialog = this.getElement('#modal-pane');
            this.#closeBtn = this.getElement('#modal-close');

            this.close = this.close.bind(this);
        }

        onStart() {
            this.#dialog.addEventListener('click', e => e.stopPropagation());
            this.#container.addEventListener('click', () => { if (!this.static) this.close(); } );
            this.#closeBtn.addEventListener('click', this.close);
        }

        close() {
            this.show = false;
            this.dispatchEvent(new Event('modal-closed', {bubbles: true}));
        }
    },
    template, styles
    
);
