
const makeTemplate = html => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template;
};

/**
 * Internal: Creates a callable component tag wrapper.
 *
 * The returned function serves two roles:
 *  - As a function, it creates a live element instance via the template pipeline.
 *  - Via `.html`, it produces a string representation suitable for templates.
 *
 * The `.tag` property exposes the component’s custom element tag name.
 *
 * Children are treated as **string-only** at this level and are inserted as
 * raw inner HTML. Non-string children are intentionally not handled here.
 *
 * @example
 *   Comp()                         // → <tag></tag> (Element)
 *   Comp({ disabled: true })       // → <tag disabled></tag>
 *   Comp(null, '<span>Hi</span>')  // → <tag><span>Hi</span></tag>
 *
 *   `${Comp.html}`                 // "<tag></tag>"
 *   `${Comp.html({ id: 'x' })}`    // "<tag id="x"></tag>"
 *   `${Comp.html(null, 'text')}`   // "<tag>text</tag>"
 *
 * @param {Function} ComponentClass
 *   Component constructor associated with this tag.
 *
 * @returns {Function & {
 *   tag: string,
 *   html: (attrs?: Object|null, children?: string|null) => string,
 *   Class: Function
 * }}
 *   Callable component factory with HTML string helper.
 */
export function comp(ComponentClass) {
    const tag = ComponentClass.tagName;

    function HTML(attrs, children) {
        const attrStr = attrs
            ? Object.entries(attrs).reduce((s, [k, v]) => {
                if (v === true) return `${s} ${k}`;
                if (v != null && v !== false) return `${s} ${k}="${v}"`;
                return s;
            }, "")
            : "";

        return `<${tag}${attrStr}>${children ?? ''}</${tag}>`
    }
    HTML.toString = () => `<${tag}></${tag}>`;
    
    function Comp(attrs, children) {
        const tmpl = makeTemplate(HTML(attrs, children));
        const el = tmpl.content.firstElementChild;

        document.adoptNode(el);
        customElements.upgrade(el);

        return el;
    }
    
    Comp.tag = tag;
    Comp.html = HTML;
    Comp.Class = ComponentClass;

    return Comp;
}