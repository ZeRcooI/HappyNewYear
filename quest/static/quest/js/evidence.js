// static/quest/js/evidence.js

document.addEventListener('DOMContentLoaded', function () {
  // Галерея (фото + видео)
  (function () {
    const backdrop = document.getElementById('galleryBackdrop');
    const closeBtn = document.getElementById('galleryClose');
    const titleEl = document.getElementById('galleryTitle');
    const imgEl = document.getElementById('galleryImage');
    const videoEl = document.getElementById('galleryVideo');

    if (!backdrop || !imgEl || !videoEl) return;

    function openModal(type, src, title) {
      imgEl.style.display = 'none';
      videoEl.style.display = 'none';

      if (type === 'photo') {
        imgEl.src = src;
        imgEl.style.display = 'block';
        videoEl.pause();
        videoEl.removeAttribute('src');
      } else if (type === 'video') {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.src = src;
        videoEl.style.display = 'block';
        videoEl.load();
      }

      if (titleEl) {
        titleEl.textContent = title || '';
      }
      backdrop.classList.add('active');
    }

    function closeModal() {
      backdrop.classList.remove('active');
      if (videoEl) {
        videoEl.pause();
      }
    }

    const items = document.querySelectorAll('.gallery-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.type || 'photo';
        const src = item.dataset.fullSrc || '';
        const title = item.dataset.title || '';
        if (!src) return;
        openModal(type, src, title);
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (backdrop.classList.contains('active')) {
          closeModal();
        }
      }
    });
  })();
});
