
const validAtributeTypes = [Boolean, Number, String];

const createFragment = html => 
    document.createRange().createContextualFragment(html);

/**
 * Creates a HTML template from the provided HTML string
 * @param {String} html - String of HTML nodes
 * @returns {HTMLElement} - The created HTML template
 */
export function createTemplate(html) {
    const template = createFragment(html).firstElementChild;

    // The root of the HTML is expected to be a template tag
    if (template.tagName != 'TEMPLATE') {
        const temp = document.createElement('TEMPLATE');
        temp.content.appendChild(template);
        return temp;
    }

    return template
}


/**
 * Creates a stylesheet object from string css styles
 * @param {String} css - String of CSS style rules
 * @returns {Object} - compiled StyleSheet
 */
export function createStyleSheet(css) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    return sheet;
}


/**
 * Creates a component from a WebComponent class implementation and template element
 * @param {Object} component    - WebComponent class implementation
 * @param {Element} template    - Internal HTML template
 */
export function createComponent(component, template=null, styles=null) {
    // Check that the component has valid values
    const attributes = component._attributes;
    for (const attr in attributes) {
        const type = attributes[attr].type;
        if (!validAtributeTypes.includes(type)) {
            throw new Error(`Component attribute '${attr}' has unsupported type`);
        }
    }
    // Add template and styles
    component._template = template;
    component._styles = styles;
    // Define custom element
    customElements.define(component.tagName, component);
}
