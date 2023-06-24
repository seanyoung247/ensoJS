
export { default } from './component.js'


(()=>{

    function loadComponents() {
        const components = document.querySelectorAll('link[rel="enso-component"]');
        for (const component of components) {
            
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadComponents);
    } else {
        loadComponents();
    }

})();

