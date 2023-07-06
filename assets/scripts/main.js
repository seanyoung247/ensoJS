import { watch } from "./components/enso/watcher.js";

(() => {
    const showModalBtn = document.getElementById('show-modal-btn');
    const testModal = document.getElementById('test-modal');
    const modal2 = document.getElementById('modal-2');
    const modalColorBtn = document.getElementById('modal-color-btn');
    const modalStaticBtn = document.getElementById('static-modal-btn');

    showModalBtn.addEventListener('click', () => {
        testModal.show = true;
    });

    modalStaticBtn.addEventListener('click', () => {
        // testModal.static = !testModal.static;
        modal2.show = true;
    });

    modalColorBtn.addEventListener('click', () => {
        testModal.classList.toggle('colored');
    });

})();

(()=>{
    const counterTestBtn = document.getElementById('counter-test-btn');
    const testCounter1 = document.getElementById('test-counter1');
    const testCounter2 = document.getElementById('test-counter2');

    counterTestBtn.addEventListener('click', () => {
        testCounter1.count++;

        const newVal = parseInt(testCounter2.getAttribute('count')) + 1;
        testCounter2.setAttribute('count', newVal);
    });
})();

