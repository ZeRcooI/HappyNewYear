document.addEventListener('DOMContentLoaded', function () {
  const csrftoken = getCookie('csrftoken');

  const openBtn = document.getElementById('openTrashBtn');
  const modal = document.getElementById('trashModal');
  const closeBtn = document.getElementById('trashClose');
  const passInput = document.getElementById('trashPassword');
  const submitBtn = document.getElementById('trashSubmit');
  const msg = document.getElementById('trashMessage');
  const content = document.getElementById('trashContent');
  const dialog = document.getElementById('trashDialog');

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
    if (dialog) {
      dialog.innerHTML = '';
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

  // modal.addEventListener('click', e => {
  //   if (e.target === modal) closeModal();
  // });

  submitBtn.addEventListener('click', () => {
    if (msg) {
      msg.textContent = '';
      msg.classList.remove('error');
    }
    if (content) content.style.display = 'none';
    if (dialog) dialog.innerHTML = '';

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

          if (content) {
            content.style.display = 'block';
          }

          if (dialog && Array.isArray(data.messages)) {
            data.messages.forEach(m => {
              const wrap = document.createElement('div');
              wrap.classList.add('trash-msg');
              if (m.speaker === 'B') {
                wrap.classList.add('trash-msg--right');
              } else {
                wrap.classList.add('trash-msg--left');
              }

              const inner = document.createElement('div');
              inner.classList.add('trash-msg-inner');

              // const label = document.createElement('div');
              // label.classList.add('trash-msg-speaker');
              // label.textContent = (m.speaker === 'B' ? 'Собеседник B' : 'Собеседник A');

              const audio = document.createElement('audio');
              audio.controls = true;
              audio.src = m.audio_url;

              audio.muted = true;
              audio.volume = 0.1;
              audio.preload = 'metadata';

              audio.addEventListener('play', () => {
                document.querySelectorAll('#trashDialog audio').forEach(a => {
                  if (a !== audio) {
                    a.pause();
                    a.currentTime = 0;
                  }
                });
              });

              // inner.appendChild(label);
              inner.appendChild(audio);
              wrap.appendChild(inner);
              dialog.appendChild(wrap);
            });
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
