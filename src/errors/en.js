
export default {
    // Component Errors
    '101': tag => (
        `Component "${tag}" is already defined. Did you load the component twice?`
    ),

    '102': () => (
        `Direct subclassing of Enso is not supported. Use Enso.component() instead.`
    ),

    '103': cType => (
        `Component expected object litteral but got "${ cType }"`
    ),

    // Watched Errors
    '201': cType => (
        `Unsupported attribute type: "${cType}"`
    ),

    '211': () => (
        "computed() expects a function"
    ),

    '212': () => (
        "computed() expects an array of dependency names"
    ),

    '213': prop => (
        `Tried to set value of computed property: "${prop}"`
    ),

    '221': () => (
        "Watches can only be applied to functions."
    ),

    '231': () => (
        "Watched property names must not start with '_'."
    ),

    // Effect Errors
    '301': err => (
        `Error in effect: ${err}`
    ),

    '302': err => (
        `Error instantiating effect: ${err}`
    ),

    '303': cType => (
        `Expected function but got "${cType}"`
    ),

    '311': err => (
        `Error running effect: ${err}`
    ),

    '312': err => (
        `Runtime error in effect: ${err}`
    ),

    // Parsers
    '401': cType => (
        `Unknown parser type "${cType}"`
    ),

    '411': () => (
        'Mismatched brackets'
    ),

    '412': err => (
        `Runtime error in for loop: ${err}`
    ),
}
