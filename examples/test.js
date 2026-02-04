import { Enso, html, attr, prop, computed } from "../src/index";
import { range } from "ensojs/helpers";


Enso.component('test-component', {
    watched: {
        show: attr(false),
        count: attr(0),
        count2: computed(function() {
            return this.count * 2
        }, ['count']),
    },
    expose: { range },
    template: html`
        <div id="test" #ref="root">
            <div *if="{{ @:show }}">
                Count is: {{ @:count }}
                Count2 is: {{ @:count2 }}
            </div>
            <div *for="item of range(@:count)">
                Item {{ item + 1 }}
            </div>
            <nested-test .list="{{ this._list }}"></nested-test>
        </div>
    `,
    script: {
        _list: ['Apple', 'Banana', 'Cherry']
    }
});

Enso.component('nested-test', {
    watched: {
        list: prop([], true),
    },
    template: html`
        <div *for="item of @:list">
            {{ item }}
        </div>
    `,
});
