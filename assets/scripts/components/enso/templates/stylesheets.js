
export default class EnsoStylesheet {
    
    #sheet = null;

    constructor(css) {
        this.#sheet = new CSSStyleSheet();
        this.#sheet.replaceSync(css);
    }

    attach(root) {
        const dom = (root instanceof ShadowRoot) ? root : document;

        dom.adoptedStyleSheets = [ ...dom.adoptedStyleSheets, this.#sheet ];
    }
}