
import { Enso, html, attr, prop, watches, lifecycle } from '../index'

Enso.component('enso-slot', {
    settings: { useShadow: false },

    watched: {
        name: attr(null, String),
        'on-add': prop(null),
        'for-each': prop(null),
        'on-remove': prop(null)
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

            for (const element of current) {
                if (!this._slotted.has(element)) {
                    this['on-add']?.(element);
                }
                this['for-each']?.(element);
            }

            for (const element of this._slotted) {
                if (!current.has(element)) {
                    this['on-remove']?.(element);
                }
            }

            this._slotted = current;
        }
    }
});
