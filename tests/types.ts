
import Enso from '../types/api.js';
import { html, css, type EnsoTemplate } from '../types/template.js';
import { range, comp, load } from '../types/helpers.js';


const cssSource = '.foo { color: red; }';
const htmlSource = '<p>Hello</p>';

const sheetFromTag: CSSStyleSheet = css`.foo { color: red; }`;
const sheetFromString: CSSStyleSheet = css(cssSource);

const templateFromTag: EnsoTemplate = html`<p>Hello</p>`;
const templateFromString: EnsoTemplate = html(htmlSource);


const Component = Enso.component('my-component', {
    template: html`<p>Hello</p>`,
    styles: css`.class { color: red; }`
});

Enso.component('good-style-array', {
    template: html`<p>Hello</p>`,
    styles: [
        css`.class { color: red; }`,
        css`p { margin: 0; }`
    ]
});

Enso.component('bad-component', {
    // @ts-expect-error strings are not Enso templates
    template: 'Hello'
});

Enso.component('bad-styles', {
    template: html`<p>Hello</p>`,

    // @ts-expect-error styles must be CSSStyleSheet or CSSStyleSheet[]
    styles: '.class { color: red; }'
});


/*
 * Helpers
 */
const Defined = Enso.define({
    template: html`<p>Defined</p>`
});

// @ts-expect-error comp requires a registered component
comp(Defined);

const Registered = Enso.register(
    'registered-component',
    Defined
);

comp(Registered);

const DirectlyRegistered = Enso.component(
    'direct-component',
    {
        template: html`<p>Direct</p>`
    }
);

comp(DirectlyRegistered);

const numbers = range(0, 10);

const size: number = numbers.size;
const first: number = numbers.step(0);
const wrapped: number | undefined = numbers.wrap(12);
// @ts-expect-error range requires numbers
range('0', 10);

for (const number of numbers) {
    const value: number = number;
    console.log(value);
}

const parseNumber = (text: string): number => Number(text);

const [text, sheet, template, number] = await load(
    import.meta.url,
    './test.txt',
    { file: './test.css', as: css },
    { file: './test.html', as: html },
    { file: './number.txt', as: parseNumber }
);

const loadedText: string = text;
const loadedSheet: CSSStyleSheet = sheet;
const loadedTemplate: EnsoTemplate = template;
const loadedNumber: number = number;

// @ts-expect-error parsed number should not be a string
const wrongNumber: string = number;

