
export { default } from './component.js'


(()=>{

    function loadComponents() {
        const components = document.querySelectorAll('link[data-component="enso"]');
        for (const component of components) {
            console.log(component.href);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadComponents);
    } else {
        loadComponents();
    }

})();

