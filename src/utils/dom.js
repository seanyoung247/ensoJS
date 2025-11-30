
/**
 * @module DOM Defines functions for DOM manipulation
 */
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

//// Templating
export const createFragment = html => 
    document.createRange().createContextualFragment(html);

export const createTemplate = html => {

    if (html instanceof HTMLTemplateElement) return html;

    // Don't allow scripts inside text HTML:
    if (typeof html === "string")
        html = html.replace(/<script\b[^>]*>.*?<\/script>/gis, '');

    const template = document.createElement('template');
    template.content.appendChild(
        (typeof html === "string") ? createFragment(html) : html
    );

    return template;

};

export const cloneTemplate = template => 
    createTemplate(template.content.cloneNode(true));

//// DOM traversal
export const getChildIndex = (parent, node) => 
    Array.prototype.indexOf.call(parent.childNodes, node);

export const createWalker = (rootNode, nodeTypes, acceptNode) => {
  const filter = (typeof acceptNode === 'function') ? { acceptNode } : null;
  return document.createTreeWalker(rootNode, nodeTypes, filter);
};
