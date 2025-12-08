// static/quest/js/files.js

document.addEventListener('DOMContentLoaded', function () {
  const fileModal = document.getElementById('fileModal');
  const fileFrame = document.getElementById('fileFrame');
  const fileClose = document.getElementById('fileModalClose');

  if (!fileModal || !fileFrame) return;

  document.querySelectorAll('.gallery-item[data-file-url]').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.fileUrl;
      if (!url) return;
      fileFrame.src = url;
      fileModal.classList.add('active');
    });
  });

  function closeFileModal() {
    fileModal.classList.remove('active');
    fileFrame.src = '';
  }

  if (fileClose) {
    fileClose.addEventListener('click', closeFileModal);
  }

  fileModal.addEventListener('click', (e) => {
    if (e.target === fileModal) {
      closeFileModal();
    }
  });
});
