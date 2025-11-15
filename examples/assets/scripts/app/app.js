
import Enso, { html, css, load, cssObj, getWatched, setWatched } from "enso";

const cssReset = await load.css('assets/styles/reset.css');

Enso.component( "enso-app", {

    watched: {
        flag: false,
        list: { value: [1,2,3] },
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
                justifyContent: 'space-evenly',
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
            <button @click="()=>{ watched:flag = !watched:flag; }">Toggle Flag</button>
            {{ watched:flag ? 'App Enso' : 'Enso App' }}

            <div *if="{{ !watched:flag }}">No Content</div>
            <div :class="{{ watched:classList }}" *if="{{ watched:flag }}">
                Content
                <div *if="{{ watched:showChild === 'show' }}">
                    Child Content <br/>
                    Flag Value = {{ watched:flag.toString() }}
                </div>
                <button @click="this.childHide">Toggle Child</button>
            </div>
            
            <div *for="item of @:list">{{ item }}</div>

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
