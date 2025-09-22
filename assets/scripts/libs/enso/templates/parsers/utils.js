
// Matches object property dependencies, i.e. this.<property>:
const bindEx = /(?:this\.)(\w+|\d*)/gi;

export const getName = attr => attr.name.slice(1).toLowerCase();
export const getBindings = (source, set) => {
    let bind;
    while ((bind = bindEx.exec(source)) !== null) {
        set.add(bind[1]);
    }
};

export const isAttr = (attribute, prefix) => (
    attribute?.name?.startsWith(prefix) ?? false
);

export const createPlaceholder = id => {
    const el = document.createElement("template");
    el.id = id;
    return el;
}

export const getDirective = (node, prefix='*') => {
    if (!node.attributes) return null;

    let directive = null;
    for (const attr of [...node.attributes]) {
        if (attr.name.startsWith(prefix)) {
            // Only one directive per node is supported
            if (!directive) directive = attr;
            node.removeAttribute(attr.name);
        }
    }

    return directive;
};
