
import { Enso, html, attr, prop, watches, lifecycle } from '../index';


function collectChanged(elements, compare, onChange = null, onAll = null) {
    const changed = [];
    for (const element of elements) {
        if (!compare.has(element)) {
            onChange?.(element);
            changed.push(element);
        }
        onAll?.(element);
    }
    return changed;
}

Enso.component('enso-slot', {
    settings: { useShadow: false },

    watched: {
        name: attr(null, String),
        'on-add': prop(null),       // Run once on an element when it is added to the slot
        'for-each': prop(null),     // Run on every slotted element whenever slotchange occurs
        'on-remove': prop(null)     // Run once on an element when it is removed from the slot 
    },

    template: html`
        <slot #ref="mySlot"
            :name="{{ @:name }}"
            @slotchange="this.onSlotChange"
        ></slot>`,

    script: {
        _slotted: null,
        onStart: watches(function () {
            this._slotted ??= new Set();
        }, [lifecycle.mount]),

        onSlotChange() {
            const elements = this.refs.mySlot.assignedElements();
            const current = new Set(elements);

            const added = collectChanged(
                current, this._slotted, 
                this['on-add'], this['for-each']
            );
            const removed = collectChanged(
                this._slotted, current, this['on-remove']
            );

            this._slotted = current;

            this.dispatchEvent(new CustomEvent('changed', {
                detail: { added, removed, current: new Set(current) },
                bubbles: true
            }));
        }
    }
});
