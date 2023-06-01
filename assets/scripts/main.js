(() => {
    const showModalBtn = document.getElementById('show-modal-btn');
    const testModal = document.getElementById('test-modal');
    const modalColorBtn = document.getElementById('modal-color-btn');

    showModalBtn.addEventListener('click', () => {
        testModal.show = true;
    });

    modalColorBtn.addEventListener('click', () => {
        testModal.classList.toggle('colored');
    });
})();