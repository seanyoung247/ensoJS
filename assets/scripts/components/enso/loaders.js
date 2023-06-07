import { createStyleSheet, createTemplate } from "./creators.js";

const buildURL = (fileURL, baseUrl) => 
    new URL(fileURL, baseUrl).href;

const loadResource = (url, builder) => fetch(url)
    .then(response => response.text())
    .then(builder);

const createFragment = html => 
    document.createRange().createContextualFragment(html);


export default {
    /**
     * Imports HTML template from external html file.
     * @param {String} url          - relative path to template file
     * @param {String} baseUrl      - url of calling file, eg. import.meta.url
     * @returns HTML Template
     */
    html: (url, baseUrl) => loadResource(
        buildURL(url, baseUrl), 
        createTemplate
    ),
    /**
     * Imports CSS stylesheet from external css file.
     * @param {String} url          - relative path to template file
     * @param {String} baseUrl      - url of calling file, eg. import.meta.url
     * @returns CSS Stylesheet                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
     */
    css: (url, baseUrl) => loadResource(
        buildURL(url, baseUrl),
        createStyleSheet
    )
}

/**
 * Creates a HTML template from the provided HTML string
 * @param {String} html - String of HTML nodes
 * @returns {HTMLElement} - The created HTML template
 */
//  function createTemplate(html) {
//     const template = createFragment(html).firstElementChild;

//     // The root of the HTML is expected to be a template tag
//     if (template.tagName != 'TEMPLATE') {
//         const temp = document.createElement('TEMPLATE');
//         temp.content.appendChild(template);
//         return temp;
//     }

//     return template
// }


// /**
//  * Creates a stylesheet object from string css styles
//  * @param {String} css - String of CSS style rules
//  * @returns {Object} - compiled StyleSheet
//  */
//  function createStyleSheet(css) {
//     const sheet = new CSSStyleSheet();
//     sheet.replaceSync(css);
//     return sheet;
// }
