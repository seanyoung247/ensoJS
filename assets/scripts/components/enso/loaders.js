import { createStyleSheet, createTemplate } from "./creators.js";

const buildURL = (fileURL, baseUrl) => 
    new URL(fileURL, baseUrl).href;

const loadResource = (url, builder) => fetch(url)
    .then(response => response.text())
    .then(builder);

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
