import { Enso, html, attr } from "ensojs";
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
        </div>
    `,
});
