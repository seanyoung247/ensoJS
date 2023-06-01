(() => {
    const testModal = document.getElementById('test-modal');
    const modalColorBtn = document.getElementById('modal-color-btn');

    modalColorBtn.addEventListener('click', () => {
        testModal.classList.toggle('colored');
    });
})();