document.addEventListener('DOMContentLoaded', function () {
  const csrftoken = getCookie('csrftoken');

  const openBtn = document.getElementById('openTrashBtn');
  const modal = document.getElementById('trashModal');
  const closeBtn = document.getElementById('trashClose');
  const passInput = document.getElementById('trashPassword');
  const submitBtn = document.getElementById('trashSubmit');
  const msg = document.getElementById('trashMessage');
  const content = document.getElementById('trashContent');
  const audio = document.getElementById('vinAudio');

  if (!openBtn || !modal || !submitBtn) return;

  const openUrl = submitBtn.dataset.openUrl || '';

  function openModal() {
    modal.classList.add('active');
    if (msg) {
      msg.textContent = '';
      msg.classList.remove('error');
    }
    if (content) {
      content.style.display = 'none';
    }
    if (passInput) passInput.value = '';
    setTimeout(() => passInput && passInput.focus(), 100);
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  openBtn.addEventListener('click', openModal);
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  submitBtn.addEventListener('click', () => {
    if (msg) {
      msg.textContent = '';
      msg.classList.remove('error');
    }
    if (content) content.style.display = 'none';

    const password =
      (passInput && passInput.value ? passInput.value : '').trim();
    if (!password) {
      if (msg) {
        msg.textContent = 'Введите пароль.';
        msg.classList.add('error');
      }
      return;
    }

    if (!openUrl) {
      if (msg) {
        msg.textContent = 'Не настроен адрес доступа к корзине.';
        msg.classList.add('error');
      }
      return;
    }

    fetch(openUrl, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrftoken || '',
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ password: password })
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          if (msg) {
            msg.textContent = data.message || 'Доступ разрешён.';
          }
          if (data.vin_audio_url && audio) {
            audio.src = data.vin_audio_url;
          }
          if (content) {
            content.style.display = 'block';
          }
        } else {
          if (msg) {
            msg.textContent = data.error || 'Неверный пароль.';
            msg.classList.add('error');
          }
        }
      })
      .catch(() => {
        if (msg) {
          msg.textContent = 'Системная ошибка.';
          msg.classList.add('error');
        }
      });
  });
});
