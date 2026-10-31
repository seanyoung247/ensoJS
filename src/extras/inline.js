
import { Enso, css,
    prop, attr, computed, watches, lifecycle
} from '../index';
import EnsoTemplate from '../templates/template';
import { load } from '../helpers/load';


async function collectSheets(styles, baseURI) {
    const sheets = [];

    for (const style of styles) {
        if ( style.hasAttribute('src') ) {
            // External stylesheet to load
            sheets.push(
                load( baseURI, {
                    file: style.getAttribute('src'),
                    as: css
                }).then( ([sheet]) => sheet )
            );
        }
        else {
            // Styles declared locally
            sheets.push( css(style.textContent) );
        }
    }

    return Promise.all(sheets);
}

function parseTemplate(template) {
    return new EnsoTemplate(template);
}

function parseScript(script) {
    const source = script?.textContent ?? '';
    const definition = {};
    const context = {
        watched: value => { definition.watched = value },
        script: value => { definition.script = value; },
        expose: value => { definition.expose = value; },
        settings: value => { definition.settings = value; },
        prop,
        attr,
        computed,
        watches,
        lifecycle
    };

    const evaluate = new Function(
        ...Object.keys(context),
        `"use strict";\n${source}`
    );

    evaluate(...Object.values(context));

    return definition;
}

async function defineComponent(definition) {
    // Extract tag name
    const tagName = definition.getAttribute('enso-component');

    // Pull out and parse the styles, template and script elements.
    const sheets = collectSheets(
        definition.content.querySelectorAll('style'),
        definition.baseURI
    );
    const template = parseTemplate(
        definition.content.querySelector('template')
    );
    const fields = parseScript(
        definition.content.querySelector('script[type=enso]')
    );
    const styles = await sheets;
    
    // Generate the component
    Enso.component(tagName, {
        styles,
        template,
        ...fields
    });

    // Remove the definition and if inline replace it with a live version
    if (definition.hasAttribute('inline')) {
        const instance = document.createElement(tagName);

        for (const { name, value } of definition.attributes) {
            if (name !== 'enso-component' && name !== 'inline') {
                instance.setAttribute(name, value);
            }

            definition.replaceWith(instance);
        }
    } else {
        definition.remove();
    }
}


(async ()=>{
    // Collect all template elements with enso-component attribute
    const definitions = document.querySelectorAll('template[enso-component]');

    const results = await Promise.allSettled(
        Array.from(definitions, defineComponent)
    );
    
    for (const result of results) {
        if (result.status === 'rejected') {
            console.error(result.reason);
        }
    }

})();
