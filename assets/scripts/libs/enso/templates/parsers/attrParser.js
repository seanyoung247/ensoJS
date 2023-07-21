
import { parser } from "../parser.js"
import { getName, getBindings } from "./utils.js";
import { runEffect, createEffect, createStringTemplate } from "../../utils/effects.js";

// Attribute binding (:<attribute name>) parser
parser.register(':', {

    createEffect(attr, code) {
        const fn = createEffect(code);
        return function (env, el) {
            const content = fn.call(this, env);
            if (content) {
                el.setAttribute(attr, (content === true) ? '' : content);
            }
            else {
                el.removeAttribute(attr);
            }
        };
    },

    preprocess(def, node, attribute) {
        const name = getName(attribute);
        const effect = this.createEffect(name, 
            createStringTemplate(attribute.value)
        );
        const attr = {
            name, effect, binds: new Set()
        };
        def.parsers.push(this);

        getBindings(attribute.value, attr.binds);

        if (!def.attrs) def.attrs = [attr];
        else def.attrs.push(attr);

        node.removeAttribute(attribute.name);
        
        return true;
    },

    process(def, component, element) {
        if (def.attrs) {
            for (const attr of def.attrs) {
                for (const bind of attr.binds) {
                    const binding = component.getBinding(bind);
                    if (binding) binding.effects.push({element, action: attr.effect});
                }
                runEffect(attr.effect, component, element);
            }
        }
    }

});