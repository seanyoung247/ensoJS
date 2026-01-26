
export default {
    // Component Errors
    E_COMPONENT_DEF: tag => (
        `Component "${tag}" is already defined. Did you load the component twice?`
    ),

    E_COMPONENT_SUB: () => (
        `Direct subclassing of Enso is not supported. Use Enso.component() instead.`
    ),

    E_COMPONENT_OBJ: cType => (
        `Component expected object litteral but got "${ cType }"`
    ),

    // Watched Errors
    E_ATTR_BAD_TYPE: cType => (
        `Unsupported attribute type: "${cType}"`
    ),

    E_COMPUTED_FN: () => (
        "computed() expects a function"
    ),

    E_COMPUTED_DEPS: () => (
        "computed() expects an array of dependency names"
    ),

    E_COMPUTED_SET: prop => (
        `Tried to set value of computed property: "${prop}"`
    ),

    E_WATCHES_FN: () => (
        "Watches can only be applied to functions."
    ),

    E_WATCHED_NAME: () => (
        "Watched property names must not start with '_'."
    ),

    // Effect Errors
    E_EFFECT_COMPILE: err => (
        `Error in effect: ${err}`
    ),

    E_EFFECT_CREATE: err => (
        `Error instantiating effect: ${err}`
    ),

    E_EFFECT_RUNNING: err => (
        `Error running effect: ${err}`
    ),

    E_EFFECT_RUNTIME: err => (
        `Runtime error in effect: ${err}`
    ),

    E_EFFECT_FUNC: cType => (
        `Expected function but got "${cType}"`
    ),

    // Parsers
    E_PARSER_TYPE: cType => (
        `Unknown parser type "${cType}"`
    ),

    E_FOR_BRACKETS: () => (
        'Mismatched brackets'
    ),

    E_FOR_RUNTIME: err => (
        `Runtime error in for loop: ${err}`
    ),
}
