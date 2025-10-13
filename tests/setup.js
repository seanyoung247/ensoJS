/* eslint-disable no-undef */

import { JSDOM } from 'jsdom';
import { vi } from 'vitest';

// If not already created by Vitest:
if (typeof window === 'undefined') {
    const { window } = new JSDOM(``);
    global.window = window;
    global.document = window.document;
}

// Add NodeFilter to the global scope (for Enso’s parser)
if (typeof globalThis.NodeFilter === 'undefined') {
    globalThis.NodeFilter = {
        FILTER_ACCEPT: 1,
        FILTER_REJECT: 2,
        FILTER_SKIP: 3,
        SHOW_ALL: 0xFFFFFFFF,
        SHOW_ELEMENT: 1,
        SHOW_TEXT: 4
    };
}

// Mock CSSStyleSheet if not available (for Enso’s css parsing)
class CSSStyleSheet {
    constructor() {
        this.cssRules = [];
    }
    replaceSync(cssText) {
        // Simple parsing: split by '}' and filter out empty rules
        this.cssRules = cssText
            .split('}')
            .map(rule => rule.trim())
            .filter(rule => rule.length > 0)
            .map(rule => ({ cssText: rule + ' }' }));
    }
    get cssText() {
        return this.cssRules.map(rule => rule.cssText).join(' ');
    }
}
vi.stubGlobal('CSSStyleSheet', CSSStyleSheet);
