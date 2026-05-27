
/**
 * @module DOM Defines functions for DOM manipulation
 */
// Part of Enso
// Licensed under the MIT License, see LICENSE file in root.

//// Templating
export const createFragment = html => 
    document.createRange().createContextualFragment(html);

const makeTemplate = html => {
    const template = document.createElement('template');
    template.content.appendChild(
        (typeof html === "string") ? 
            createFragment(html) : html
    );
    return template;
}

export const createTemplate = html => {

    const template = (html instanceof HTMLTemplateElement) ?
        html : makeTemplate(html);

    // Script tags are not allowed within enso templates
    template.content.querySelectorAll('script')
        .forEach(script => script.remove());

    // HTML comments are stripped from enso templates
    const walker = document.createTreeWalker(
        template.content,
        NodeFilter.SHOW_COMMENT
    );
    
    const comments = [];

    let node;

    while ((node = walker.nextNode())) {
        comments.push(node);
    }

    comments.forEach(comment => comment.remove());

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
