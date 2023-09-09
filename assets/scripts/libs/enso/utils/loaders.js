
import EnsoTemplate from "../templates/templates.js";
import { createStyleSheet } from "./css.js";

const extension = /(?:\w+\.)(\w+)$/;

export const load = {

    all(resolver, ...args) {
        return Promise.all( args.map(file => {
            // Try and guess the file type from the extension
            const loader = this[file.match(extension)[1]] ?? this.text;
            return loader.call(this, resolver, file);
        }));
    },

    json(resolver, file) {
        return this.load(resolver, file)
            .then(responce => responce.json);
    },

    text(resolver, file) {
        return this.load(resolver, file)
            .then(responce => responce.text());
    },

    css(resolver, file) {
        return this.text(resolver, file)
            .then(css => createStyleSheet(css));
    },

    html(resolver, file) {
        return this.text(resolver, file)
            .then(html => new EnsoTemplate(html));
    },

    load(resolver, file) {
        if (typeof resolver === 'function') {
            file = resolver(file);
        } else {
            file = resolver;
        }
        return fetch(file);
    }

};

