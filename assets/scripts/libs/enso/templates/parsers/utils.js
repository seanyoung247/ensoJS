
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

export const placeholder = id => {
    const el = document.createElement("template");
    el.id = id;
    return el;
}

