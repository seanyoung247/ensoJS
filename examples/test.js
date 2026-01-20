import { Enso, html, attr, prop, watches } from "ensojs";
import { range } from "ensojs/helpers";

Enso.component('test-component', {
    watched: {
        show: attr(false),
        count: attr(0),
    },
    expose: { range },
    template: html`
        <div id="test" #ref="root">
            <div *if="{{ @:show }}">
                Count is: {{ @:count }}
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
