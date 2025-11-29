
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
        <enso-fragment id="fragment"></enso-fragment>
    `
});


describe('Fragment tag elements', () => {

    let el, root;
    beforeEach(async () => {
        [el, root] = setup(templateTest);
        await nextFrame();
    });

    it("Renders fragment contents correctly", () => {
        const itemList = el.refs.itemList;
        expect(itemList.children.length).toBe(2);
    });

    it("removes loose fragments", () => {
        const frag = root.getElementById("fragment");
        expect(frag).toBeNull();
    });

    it("Doesn't render fragments", () => {
        const frag = root.querySelectorAll("enso-fragment");
        expect(frag.length).toBe(0);
    });
});
