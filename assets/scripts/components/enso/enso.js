
export { default } from './component.js'
import { load } from './resources.js';
export { load };

(()=>{

    function loadComponents() {
        const components = document.querySelectorAll('link[data-component="enso"]');
        for (const component of components) {
            const com = component.getAttribute('crossorigin');
            const header = (com !== null) ? {
                    method: 'GET', credentials: 'same-origin', mode: 'cors'
                } : {
                    method: 'GET', mode: 'no-cors'
                };

            fetch(component.href, header)
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

