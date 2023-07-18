import EnsoStylesheet from "../templates/stylesheets.js";
import EnsoTemplate from "../templates/templates.js";

const extension = /(?:\w+\.)(\w+)$/;

export const load = {

    all(resolver, ...args) {
        return Promise.all( args.map(file => {
            // Try and get the file type from the extension
            const loader = this[file.match(extension)[1]] ?? this.text;
            return loader(resolver(file));
        }));
    },

    json(url) {
        return fetch(url)
            .then(responce => responce.json);
    },

    text(url) {
        return fetch(url)
            .then(responce => responce.text());
    },

    css(url) {
        return fetch(url)
            .then(responce => responce.text())
            .then(css => new EnsoStylesheet(css));
    },

    html(url) {
        return fetch(url)
            .then(responce => responce.text())
            .then(html => new EnsoTemplate(html));
    },

};

