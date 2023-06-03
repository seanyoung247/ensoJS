(() => {
    const showModalBtn = document.getElementById('show-modal-btn');
    const testModal = document.getElementById('test-modal');
    const modalColorBtn = document.getElementById('modal-color-btn');
    const modalStaticBtn = document.getElementById('static-modal-btn');

    showModalBtn.addEventListener('click', () => {
        testModal.show = true;
    });

    modalStaticBtn.addEventListener('click', () => {
        testModal.static = !testModal.static;
    });

    modalColorBtn.addEventListener('click', () => {
        testModal.classList.toggle('colored');
    });
})();