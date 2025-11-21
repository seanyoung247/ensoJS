
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

import { describe, it, expect } from 'vitest';
import { css, html } from '../../src/core/tags.js';
import EnsoTemplate from '../../src/templates/templates.js';

describe('css', () => {
    it('creates a CSSStyleSheet from template strings', () => {
        const sheet = css`
            body { background-color: red; }
            .class { color: white; }
        `;
        expect(sheet).toBeInstanceOf(CSSStyleSheet);
        expect(sheet.cssRules.length).toBe(2);
        expect(sheet.cssRules[0].cssText).toBe('body { background-color: red; }');
        expect(sheet.cssRules[1].cssText).toBe('.class { color: white; }');
    });
});

describe('html', () => {
    it('creates an EnsoTemplate from template strings', () => {
        const template = html`<div class="test">Hello, World!</div>`;
        expect(template).toBeInstanceOf(EnsoTemplate);
    });
});