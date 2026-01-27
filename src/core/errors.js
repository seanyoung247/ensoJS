
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
    if (typeof fn === 'function') errorResolver = fn;
};


// Component Errors
//  E_COMPONENT_DEF: 101,   //
//  E_COMPONENT_SUB: 102,   //
//  E_COMPONENT_OBJ: 103,   //

// Watched Errors
//  E_ATTR_BAD_TYPE: 201,   //
//  E_COMPUTED_FN: 211,     //
//  E_COMPUTED_DEPS: 212,   //
//  E_COMPUTED_SET: 213,    //
//  E_WATCHES_FN: 221,      //
//  E_WATCHED_NAME: 231,    //

//  Effect Errors
//  E_EFFECT_COMPILE: 301,  //
//  E_EFFECT_CREATE: 302,   //
//  E_EFFECT_FUNC: 303,     //
//  E_EFFECT_RUNNING: 311,  //
//  E_EFFECT_RUNTIME: 312,  //

// Parser Errors
//  E_PARSER_TYPE: 401,     //
//  E_FOR_BRACKETS: 411,    //
//  E_FOR_RUNTIME: 412,     //
