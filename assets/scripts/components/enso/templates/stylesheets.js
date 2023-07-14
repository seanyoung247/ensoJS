
export default class EnsoStylesheet {
    
    #sheet = new CSSStyleSheet();

    constructor(css) {
        this.#sheet.replaceSync(css);
    }

    adopt(root) {
        const dom = (root instanceof ShadowRoot) ? 
            root : document;
            
        dom.adoptedStyleSheets = 
            [ ...dom.adoptedStyleSheets, this.#sheet ];
    }
}