
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

export const createStyleSheet = css => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    return sheet;
};

export const attachStyleSheets = (host, sheets)=> {
    const root = host instanceof ShadowRoot ?
        host : host.getRootNode();

    if ( !(root instanceof Document || root instanceof ShadowRoot) ) {
        return;
    }

    root.adoptedStyleSheets = [ 
        ...root.adoptedStyleSheets, 
        ...sheets
    ];
};
