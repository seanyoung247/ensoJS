
import { describe, it, expect, beforeEach } from 'vitest';
import Enso, { prop, html } from "../../src/enso.js";
import { nextFrame, setup } from '../shared.js';


const templateTest = "enso-template-test";
Enso.component( templateTest, {
    watched: {
        list: prop([1,2,3]),
    },
    template: html`
        <ul #ref="itemList">
            <enso-fragment *for="item of @:list">
                <li *if="{{ item !== 2 }}">
                    {{ item }}
                </li>
            </enso-fragment>
        </ul>
    `
});


describe('Template tag elements', () => {

    let el;
    beforeEach(async () => {
        [el, ] = setup(templateTest);
        await nextFrame();
    });

    it("Renders template contents correctly", () => {
        const itemList = el.refs.itemList;
        expect(itemList.children.length).toBe(2);
    });
});
