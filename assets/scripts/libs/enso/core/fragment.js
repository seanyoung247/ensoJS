
/**
 * Enso Fragment base class
 * 
 * Represents a dynamic fragment of DOM that can be mounted and unmounted
 * based on conditions in the parent component.
 * 
 * Fragments are used to implement control flow directives such as *if and *for
 * 
 */
class EnsoFragment {
    #bindings = new Map();  // Bindings in this fragment
    #template;              // Template for this fragment
    #parent;                // Parent Component
    #anchor;                // Comment node defining the fragments DOM position
    #root;                  // Mounted fragment root node

    constructor(parent, template, anchor) {

    }

    get placeholder() {return "enso:fragment";}

    //// Fragment Lifecycle
    mount() {}

    markChanged() {}

    update() {}

    unmount() {}
}
