
import { Enso } from '../index';


(async ()=>{
    // Collect all template elements with enso-component attribute
    const definitions = document.querySelectorAll('template[enso-component]');

    const results = await Promise.allSettled(
        Array.from(definitions, Enso.sfc, Enso)
    );
    
    for (const result of results) {
        if (result.status === 'rejected') {
            console.error(result.reason);
        }
    }

})();
