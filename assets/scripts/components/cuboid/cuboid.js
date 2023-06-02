
import { WebComponent, createComponent, createStyleSheet, createTemplate } from "../enso/assembly";

const template = createTemplate(
    ``
);

const styles = createStyleSheet(
    ``
);

createComponent(

    class extends WebComponent {
        static get tagName() { return 'css3d-cuboid'; }
        static get attributes() {
            return {
                'width': {type: String, default: 0},
                'height': {type: String, default: 0},
                'depth': {type: String, default: 0}
            }
        }
    },
    template, styles

);
