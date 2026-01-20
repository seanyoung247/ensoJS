
import { parser } from "../parser.js";
import { Effect, Action, compileValue } from "../../core/effects.js";
import { addBinding, bindSource, getBindings } from './utils.js';

const mutatorCTX = {
    parser,
    Effect, Action, compileValue,
    addBinding, bindSource, getBindings
}
export function registerMutator(plugin) {
    parser.registerMutator(
        plugin(mutatorCTX)
    );
}


export function registerOperator(plugin) {

}