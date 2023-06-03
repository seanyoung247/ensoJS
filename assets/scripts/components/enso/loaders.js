import { createStyleSheet, createTemplate } from "./creators.js";

const buildURL = (fileURL, baseUrl) => new URL(fileURL, baseUrl).href;

const loadResource = (url) => fetch(url).then(response => response.text());

/**
 * Imports HTML template from external html file.
 * @param {String} templateURL  - relative path to template file
 * @param {String} baseUrl      - url of calling file, eg. import.meta.url
 * @returns HTML Template
 */
export const importTemplate = (templateURL, baseUrl) =>
    loadResource(buildURL(templateURL, baseUrl))
        .then( createTemplate );

/**
 * Imports HTML template from external html file.
 * @param {String} templateURL  - relative path to template file
 * @param {String} baseUrl      - url of calling file, eg. import.meta.url
 * @returns HTML Template
 */
export const importStyles = (styleURL, baseUrl) => 
    loadResource(buildURL(styleURL, baseUrl))
        .then( createStyleSheet );

