
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

let errorResolver = (code, data) => `${code}: ${data}`; 

export const ensoError = (code, data) => {
    throw new Error(`[Enso] - ${errorResolver(code, data)}`);
};

export const ensoReport = (level, code, data) => {
    const reporter = console[level];
    if (reporter) reporter(`[Enso] - ${errorResolver(code, data)}`);
};

export const setErrorResolver = fn => {
    errorResolver = fn;
};
