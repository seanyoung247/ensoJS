/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-undef */

// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.
import { ROOT } from '../src/core/symbols.js';

export const UUIDRegEx = /^[A-Za-z0-9_-]{6}$/;

export const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));


export const setup = (component) => {
    document.body.innerHTML = 
        `<${component} id="test-component"></${component}>`;

    const el = document.getElementById('test-component');
    const root = el[ROOT];
    return [ el, root ];
};

export const clearDOM = () => {
    document.body.innerHTML = '';
};

export const getTestElement = (attribute, value) => {
    const parent = document.createElement('div');
    parent.innerHTML = `<div ${attribute}="${value}"></div>`;
    return parent.firstChild;
};

export const testMode = (() => {
    if (!!process.env.BUILD) {
        return {
            tests: [
                "tests/public/**/*.spec.js",
                "tests/e2e/**/*.spec.js"
            ],
            importModule: async () => await import('../dist/enso.es.js'),
            importHelpers: async () => await import('../dist/helpers.es.js')
        };
    }
    return {
        tests: [
            "tests/internal/*.spec.js", 
            "tests/internal/**/*.spec.js",
            "tests/public/**/*.spec.js",
            "tests/e2e/**/*.spec.js"
        ],
        importModule: async () => await import('../src/index.js'),
        importHelpers: async () => await import('../src/helpers/index.js')
    };
})();
