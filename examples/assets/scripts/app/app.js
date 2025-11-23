
import Enso, { html, css, load, cssObj, getWatched, setWatched } from "enso";

const cssReset = await load.css('assets/styles/reset.css');

Enso.component( "enso-app", {

    watched: {
        flag: false,
        flag2: true,
        list: { value: [1,2,3], deep: true },
        showChild: { value: 'show' },
        classList: { value: 'if-test' },
    },

    expose: { cssObj },

    styles: [
        cssReset,
        css`${cssObj({
            "#app-root": {
                display: 'flex',
                flexDirection: 'column',
                "align-items": 'center',
                justifyContent: 'space-between',
                padding: '2em',
                border: '1px solid black',
                height: '100vh',
            },
            button: {
                padding: '5px 10px',
                borderRadius: '10px',
                backgroundColor: '#888',
            },
            ".if-test": {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid white',
                padding: '10px',
                margin: '10px',
                '& div': {
                    textAlign: 'center'
                }
            }
        })}`
    ],

    template: html`
        <style>
            ${ cssObj({
                div: {
                    backgroundColor: "{{ watched:flag ? 'red' : 'green' }}",
                    color: 'white',
                }
            }) }
        </style>
        <div id="app-root"
            :style="{{ cssObj({fontWeight: watched:flag && 'bold'}) }}">
            <div>
                <button @click="()=>{ watched:flag = !watched:flag; }">
                    Toggle Flag
                </button>
                <button @click="()=>{ watched:flag2 = !watched:flag2; }">
                    Toggle Flag2
                </button>
                <button @click="()=>{ watched:list.push(watched:list.length + 1); }">
                    Add List Item
                </button>
            </div>

            {{ watched:flag ? 'App Enso' : 'Enso App' }}
            {{ @:flag2.toString()}}

            <div *if="{{ !watched:flag }}">No Content</div>
            <div :class="{{ watched:classList }}" *if="{{ watched:flag }}">
                Content
                <div *if="{{ watched:showChild === 'show' }}">
                    Child Content <br/>
                    Flag Value = {{ watched:flag2.toString() }}
                </div>
                <button @click="this.childHide">Toggle Child</button>
            </div>
            <div class="for-item" *for="[index, item] of @:list.entries()">
                For Item = {{ item }}, {{ @:flag2.toString() }} |
                <button @click="()=>{ @:list.splice(index,1); }">
                    X
                </button>
            </div>

            Hello {{ watched:flag ? 'You' : 'World' }}
        </div>
    `,

    script: {
        childHide() {
            let { showChild } = getWatched(this);
            showChild = (showChild === 'hide') ? 'show' : 'hide';
            setWatched(this, {showChild});
        }
    }
});
