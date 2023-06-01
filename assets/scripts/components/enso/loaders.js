
const buildURL = (fileURL, baseUrl) => new URL(fileURL, baseUrl).href;

const loadResource = (url) => fetch(url).then(response => response.text());

const createFragment = (html) => 
    document.createRange().createContextualFragment(html);

/**
 * Imports HTML template from external html file.
 * @param {String} templateURL  - relative path to template file
 * @param {String} baseUrl      - url of calling file, eg. import.meta.url
 * @returns HTML Template
 */
export const importTemplate = (templateURL, baseUrl) =>
    loadResource(buildURL(templateURL, baseUrl))
        .then(html => createFragment(html).firstElementChild);

/**
 * Imports HTML template from external html file.
 * @param {String} templateURL  - relative path to template file
 * @param {String} baseUrl      - url of calling file, eg. import.meta.url
 * @returns HTML Template
 */
export const importStyles = (styleURL, baseUrl) => 
    loadResource(buildURL(styleURL, baseUrl))
        .then(css => {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(css);
            return sheet;
        });

