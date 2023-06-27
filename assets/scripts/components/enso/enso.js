
export { default } from './component.js'
import { load } from './resources.js';

(()=>{

    function loadComponents() {
        const components = document.querySelectorAll('link[data-component="enso"]');
        for (const component of components) {
            fetch(component.href, {
                method: 'GET',
                credentials: 'include',
                mode: 'no-cors'
            })
                .then(responce => responce.text())
                .then(data => console.log(data));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadComponents);
    } else {
        loadComponents();
    }

})();

