export const classList = (...classes) => {
    return classes.reduce((p, c) => p + (p && c ? ' ' : '') + (c ? c : ''), '');
};