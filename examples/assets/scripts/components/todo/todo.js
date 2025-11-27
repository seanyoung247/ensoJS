
import Enso, { prop, html, css } from "enso";

function slotChange(e) {
    console.log(e.target.assignedElements());
}

Enso.component( 'enso-todo', {
    watched: {
        items: prop(['cheese', 'pork'], true)
    },

    expose: { slotChange },

    styles: css`
        slot#hidden { display: none; }
        form { 
            display: flex;
            flex-direction: column;
        }
        ul {
            list-style: none;
            padding: 0;
        }
    `,

    template: html`
        <div>
            <form>
                <input #ref="itemText" type="text" id="item-text" required />
                <input 
                    type="submit" value="Add Item"
                    @click="(e)=>{
                        e.preventDefault();
                        const itemText = this.refs.itemText;
                        if (itemText.value) @:items.push(itemText.value);
                        itemText.value = '';
                    }"
                >
            </form>
            <ul>
                <li *for="item of @:items">{{ item }}</li>
            </ul>
        <div>
    `,

});