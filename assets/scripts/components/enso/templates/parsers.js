
const noParser = {
    preprocess() { return false; }
};

export const parsers = (()=>{
    const parsers = new Map();

    return {
        register(id, parser) {
            parsers.set(id, parser);
        },

        parse(id) {
            return (parsers.get(id) ?? noParser);
        }
    };
})();

export const createNodeDef = index => ({
    index,          // Index in the node list
    ref: null,      // Name to use for element reference or null (no reference)
    binds: null,    // List of bound component properties
    events: null,   // List of event handlers
    content: null   // Content mutation
})

const getName = attr => attr.name.slice(1).toLowerCase();

// Matches object property dependencies, i.e. this.<property>:
const bindEx = RegExp(/(?:this\.)(\w+|\d*)/gi);

// Textnode parser
parsers.register('TEXT', {

    preprocess(def, node) {
        const span = document.createElement('span');

        def.content = '`' + node.nodeValue
            .replaceAll('{{', '${')
            .replaceAll('}}', '}')
            .trim() + '`';

        node.parentNode.replaceChild(span, node);
        if (!def.binds) def.binds = new Set();

        let bind;
        while (bind = bindEx.exec(def.content)) {
            def.binds.add(bind[1]);
        }

        return span;
    }

});

// Reference Attribute (#ref) parser
parsers.register('#', {

    preprocess(def, node, attribute) {
        def.ref = attribute.value;
        node.removeAttribute(attribute.name);

        return false;
    }

});

// Event Attribute (@<event name> parser)
parsers.register('@', {

    preprocess(def, node, attribute) {
        const event = {
            name: getName(attribute), 
            value: attribute.value
        };

        if (!def.events) def.events = [ event ];
        else def.events.push( event );
        node.removeAttribute(attribute.name);

        return true;
    }

});