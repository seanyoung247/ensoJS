
import EnsoTemplate from "./templates.js";

const buildURL = (fileURL, baseUrl) => 
    new URL(fileURL, baseUrl).href;

const loadResource = (url, builder) => fetch(url)
    .then(response => response.text())
    .then(builder);

const loadExternal = (url, baseUrl) => fetch(buildURL(url, baseUrl))
    .then(responce => responce.text());

export const build = {
    /**
     * Creates a HTML template from the provided HTML string
     * @param {String} html     - String of HTML nodes
     * @returns {HTMLElement}   - The created HTML template
     */
    template: html => new EnsoTemplate(html),

    /**
     * Creates a stylesheet object from string css styles
     * @param {String} css      - String of CSS style rules
     * @returns {Object}        - compiled StyleSheet
     */
    stylesheet: css => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(css);
        return sheet;
    }
}    

export const load = {
    external: (baseUrl, ...args) => Promise.all(args.map(file => loadExternal(file, baseUrl))),
    /**
     * Imports HTML template from external html file.
     * @param {String} url          - relative path to HTML template file
     * @param {String} baseUrl      - url of calling file, eg. import.meta.url
     * @returns {Promise} HTML Template
     */
    html: (url, baseUrl) => loadResource(
        buildURL(url, baseUrl), 
        build.template
    ),

    /**
     * Imports CSS stylesheet from external css file.
     * @param {String} url          - relative path to CSS file
     * @param {String} baseUrl      - url of calling file, eg. import.meta.url
     * @returns {Promise} CSS Stylesheet                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
     */
    css: (url, baseUrl) => loadResource(
        buildURL(url, baseUrl),
        build.stylesheet
    ),

    /**
     * Imports HTML template and stylesheet from external files.
     * @param {String} htmlUrl      - relative path to HTML template file
     * @param {String} cssUrl       - relative path to CSS file
     * @param {String} baseUrl      - url of calling file, eg. import.meta.url 
     * @returns {Promise} [HTML template, CSS spreadsheet]
     */
    htmlAndCss: (htmlUrl, cssUrl, baseUrl) => Promise.all([
        load.html(htmlUrl, baseUrl),
        load.css(cssUrl, baseUrl)
    ])
};

