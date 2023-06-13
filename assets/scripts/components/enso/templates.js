/**
 * Templating
 */

export class EnsoTemplate {
    #template = null;

    constructor(html) {
        let template = createFragment(html).firstElementChild;
        
        if (this.#template.tagName != 'TEMPLATE') {
            template = document.createElement('template');
            template.content.appendChild(this.#template);
            this.#template = template;
        }

        // Parse template
        this.#template = this.#parse(template);
    }

    #parse() {
        // Strip templated directives out and prep them for evaluation
        /* Need to store:
         *  o   Referenced nodes
         *  o   Mutated nodes.
         *        Nodes that have simple mutations,
         *        Attributes or text content that changes
         *        { 
         *          NodeTag,    - An identifier for the node
         *          attribute,  - List? of attributes that are mutated
         *          operation   - Code run on change
         *        }
         *  o   Conditionals
         *  o   ForEach
         */
    }
}