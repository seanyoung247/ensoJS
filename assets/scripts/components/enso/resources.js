
const buildURL = (fileURL, baseUrl) => 
    new URL(fileURL, baseUrl).href;

const loadExternal = (url, baseUrl) => fetch(buildURL(url, baseUrl))
    .then(responce => responce.text());


export const load = {
    external: (baseUrl, ...args) => Promise.all(args.map(file => loadExternal(file, baseUrl))),
};

