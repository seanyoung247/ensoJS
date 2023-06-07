import { createStyleSheet, createTemplate } from "./creators.js";

const buildURL = (fileURL, baseUrl) => 
    new URL(fileURL, baseUrl).href;

const loadResource = (url, builder) => fetch(url)
    .then(response => response.text())
    .then(builder);

export default {
    html: (url, baseUrl) => loadResource(
        buildURL(url, baseUrl), 
        createTemplate
    ),
    css: (url, baseUrl) => loadResource(
        buildURL(url, baseUrl),
        createStyleSheet
    )
}
