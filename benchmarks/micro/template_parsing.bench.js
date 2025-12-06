
import { bench } from 'vitest';
import EnsoTemplate from '../../src/templates/template.js';

const html = /*html*/ `
<div id="if-parent" *if="{{ watched:isVisible === true}}">
    Hello {{ watched:name }}!
    <span id="ref" #ref="myRef"></span>
    <div id="if-child" #ref="anotherRef" *if="{{ watched:childIsVisible }}">
        Child Content
    </div>
</div>
<button id="test-btn" @click="()=>watched:childIsVisible = !watched:childIsVisible">
    Test Button
</button>
<div id="active" :class="{{ watched:name }}" :data-active="{{ watched:isActive ? 'True' : 'False' }}">
    Active Content: {{ watched:isActive ? 'True' : 'False' }}
    <div id="unwatched-2">No Template Directives</div>
</div>
<div id="unwatched-3">No Template Directives</div>
`;

bench('Template parsing + preprocessing', () => {
  new EnsoTemplate(html);
});
