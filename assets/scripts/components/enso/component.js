
import EnsoStylesheet from "./stylesheets.js";
import EnsoTemplate from "./templates.js";

function createHandler(code, context) {
    const func = new Function(`return ${code}`);
    return func.call(context);
}

export const validAtributeTypes = Object.freeze([
    Boolean, 
    Number,
    String
]);

/**
 * Enso Web Component base class
 * @abstract
 */
export default class Enso extends HTMLElement {

    static component({}) {}

}
