
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

        #clickOut = () => this.show = this.static
        #clickClose = () => this.show = false;
        #clickPane = e => e.stopPropagation();

        constructor() {
            super();
            this._createShadowDOM();
        }

        onStart() {
            this.getElement('#modal-pane')
                .addEventListener('click', this.#clickPane);

            this.getElement('#modal-container')
                .addEventListener('click', this.#clickOut );

            this.getElement('#modal-close')
                .addEventListener('click', this.#clickClose );
        }

        onRemoved() {
            this.getElement('#modal-pane')
                .removeEventListener('click', this.#clickPane);

            this.getElement('#modal-container')
                .removeEventListener('click', this.#clickOut );

            this.getElement('#modal-close')
                .removeEventListener('click', this.#clickClose );
        }

        onPropertyChange(prop, value) {
            if (prop === 'show' && value === false) {
                this.dispatchEvent(new Event('modal-closed', {bubbles: true}));
            }
        }
    },
    template, styles
    
);
