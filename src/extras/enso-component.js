
import { Enso, html } from '..index';


Enso.component('enso-component', {
    template: html``,

    script: {

    }
});


const ex = `
<enso-component tag="tiny-counter" value="5" inline>
    <template>
        <script type="enso">
            watched({
                value: attr(0)
            });

            script({
                increment() { this.value++; },
                decrement() { this.value--; }
            });
        </script>
        <style>
            :host{
                display: flex;
                justify-content: space-between;
            }
        </style>

        <enso-template>
            <style>
                :host {
                    color: {{ @:value > 10 ? 'red' : 'black' }};
                }
            </style>

            <button @click="this.decrement">-</button>
            {{ @:value }}
            <button @click="this.increment">+</button>
        </enso-template>
    </template>
</enso-component>`;