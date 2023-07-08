
const noParser = {
    preprocess() { return false; }
};

export const parser = (() => {
    const parsers = new Map();

    return {
        register(id, parser) {
            parsers.set(id, parser);
        },

        getParser(id) {
            return (parsers.get(id) ?? noParser);
        },

        preprocess(def, node, attribute=null) {
            const id = attribute ? attribute.name[0] : 'TEXT';
            const parser = this.getParser(id);
            return parser.preprocess(def, node, attribute);
        },

        process() {

        }
    };
})();

export const createNodeDef = index => ({
    index,          // Index in the node list
    ref: null,      // Name to use for element reference or null (no reference)
    binds: null,    // List of bound component properties
    events: null,   // List of event handlers
    content: null,  // Content mutation
    parsers: [],    // List of attached parsers
})

const getName = attr => attr.name.slice(1).toLowerCase();

// Matches object property dependencies, i.e. this.<property>:
const bindEx = RegExp(/(?:this\.)(\w+|\d*)/gi);

// Textnode parser
parser.register('TEXT', {

    preprocess(def, node) {
        const span = document.createElement('span');

        def.parsers.push('TEXT');
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
    },

    process(component, element) {

    }

});

// Reference Attribute (#ref) parser
parser.register('#', {

    preprocess(def, node, attribute) {
        def.parsers.push('#');
        def.ref = attribute.value;
        node.removeAttribute(attribute.name);

        return false;
    },

    process() {

    }

});

// Event Attribute (@<event name>) parser
parser.register('@', {

    preprocess(def, node, attribute) {
        const event = {
            name: getName(attribute), 
            value: attribute.value
        };
        def.parsers.push('@');

        if (!def.events) def.events = [ event ];
        else def.events.push( event );
        node.removeAttribute(attribute.name);

        return true;
    },

    process() {

    }

});

// Attribute binding (:<attribute name>) parser
// Property binding (.<property name>) parser
// Command directive (*<command>) parser