
export default class EnsoStylesheet {
    
    #sheet = new CSSStyleSheet();

    constructor(css) {
        this.#sheet.replaceSync(css);
    }

    get sheet() { return this.#sheet; }

    adopt(root) {
        const dom = (root instanceof ShadowRoot) ? 
            root : document;
            
        dom.adoptedStyleSheets = 
            [ ...dom.adoptedStyleSheets, this.#sheet ];
    }
}