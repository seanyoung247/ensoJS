
export const createStyleSheet = css => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    return sheet;
}

export const attachStyleSheets = (root, sheets)=> {
    const dom = (root instanceof ShadowRoot) ?
        root : document;

    dom.adoptedStyleSheets = 
        [ ...dom.adoptedStyleSheets, ...sheets];
}