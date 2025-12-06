# Enso 

<img src="docs/icon.svg" width="100">

![npm version](https://img.shields.io/npm/v/ensojs?color=ca2e2e)
![bundle size](https://img.shields.io/bundlephobia/minzip/ensojs?label=size&color=ca2e2e&labelColor=333333)
![license](https://img.shields.io/github/license/seanyoung247/ensojs)
<!-- ![npm total downloads](https://img.shields.io/npm/dt/ensojs) -->
![issues](https://img.shields.io/github/issues/seanyoung247/ensojs)
<!-- ![stars](https://img.shields.io/github/stars/seanyoung247/ensojs?style=social) -->
<!-- [![docs](https://img.shields.io/badge/docs-online-ca2e2e)](TODO link) -->

Enso is a lightweight Web Component framework that simplifies development by removing boilerplate, providing intuitive declarative templates, and enabling clean component structure.

It aims to be modern, minimal, and forward-focused — no compile step, no virtual DOM, and no legacy baggage.

## Philosophy

Enso is guided by a few simple principles:

- **Native-first** — built on the modern web: Custom Elements, Shadow DOM, and template literals.
- **Minimal surface area** — small API, small mental overhead.
- **Declarative over imperative** — components describe what they are, not how to wire them.
- **No build step** — just write HTML, CSS, and JS.
- **Modern browser focus** — no polyfills, no legacy module formats, no baggage.
- **Zero boilerplate** — refs, events, bindings, and reactivity should “just work.”

## 🌱 Features

- ✨ Tiny, modern, reactive core
- 💡 Component-based architecture using native custom elements
- 🔍 Intuitive templates with `{{ @:value }}`
- ⚡ Reactive proxies with minimal overhead
- 🎨 Built-in helpers for attributes, props, styles, and templates
- 🧩 No build step required for usage
- 📦 ESM-first, no legacy module formats
- 🔌 Extensible template pipeline — define custom attribute handlers or parsing steps

## History

Enso began life as a small utility class intended to reduce the repetitive boilerplate associated with writing Web Components. You simply extended from it, and added your own code.

```javascript
class MyComponent extends WebComponent {
    static get tagName() { return 'my-component'; }
    static get attributes() {
        return { 'value': {type: Number, default: 0} };
    }
    // component logic
}
```

As real-world components grew, new sources of repetitive boilerplate appeared. For instance, querying the DOM for child elements. To solve this, a quick and simple processing step was added to the template parsing, to extract `#ref="myRef"` attributes, and insert them as fields on the component, for a simple access `this.myRef`. But it soon became apparent that there was still a great deal of boilerplate, attaching events and the `@<event>=""` attribute evolved to replace calls to `this.myRef.addEventListener(...)`. As more features were added, Enso started to form.

From:

```javascript
class MyComponent extends Enso {
    static get tagName() { return 'my-component'; }
    // component logic
}
```

To the current declarative:

```javascript
Enso.component('my-component', {
    // Component declaration
});
```

Enso today continues that original spirit: remove friction, embrace clarity, let components express themselves naturally.

## 📦 Installation

```bash
npm install ensojs
```

Or via CDN:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/ensojs/dist/ensojs.es.js"></script>
```

## 🚀 Example

A simple reactive counter component:

![rendered image of tiny-counter component](docs/tiny-counter.png)

```javascript
import Enso, { css, html, attr } from 'ensojs';

Enso.component('tiny-counter', {
    watched: { value: attr(0) },
    styles: css`:host{
        display:flex;
        justify-content:space-between;
    }`,
    template: html`
        <button @click="()=>@:value--">-</button>
        {{ @:value }}
        <button @click="()=>@:value++">+</button>
    `
});
```

```html
<tiny-counter></tiny-counter>
```

## Development

If you'd like to contribute you can fork the repo:

```bash
git clone git@github.com:seanyoung247/ensojs.git
cd ensojs
npm i
```

## Documentation

TBC

## Testing

A full suite of tests are provided in the repo using vitest.

Run tests:

```bash
npm run test
```

Test coverage:

```bash
npm run coverage
```

Run tests against the local build:

```bash
npm run test:build
```

## License

Enso is open-source software released under the [MIT License](./LICENSE).

_Currently licensed under MIT. Future releases may adopt Apache 2.0 if broader legal protections are needed._
