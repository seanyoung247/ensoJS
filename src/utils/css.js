
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

const styleSheets = new Map();


export const createStyleSheet = css => {
    let sheet = styleSheets.get(css);

    if (!sheet) {
        sheet = new CSSStyleSheet();
        sheet.replaceSync(css);
        styleSheets.set(css, sheet);
    }

    return sheet;
};


export const attachStyleSheets = (host, sheets)=> {
    const root = host instanceof ShadowRoot ?
        host : host.getRootNode();

    if ( !(root instanceof Document || root instanceof ShadowRoot) ) {
        return;
    }

    const adopted = [...root.adoptedStyleSheets];
    const count = adopted.length;

    for (const sheet of sheets) {
        if (!adopted.includes(sheet)) {
            adopted.push(sheet);
        }
    }
    
    if (adopted.length !== count) {
        root.adoptedStyleSheets = adopted;
    }
};
