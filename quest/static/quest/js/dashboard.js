// static/quest/js/dashboard.js

// CSRF из cookie (стандартная функция из доки Django)
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const c = cookie.trim();
      if (c.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(c.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

document.addEventListener('DOMContentLoaded', function () {
  const csrftoken = getCookie('csrftoken');

  // ---------- АНИМАЦИЯ ПРОГРЕСС-БАРА ПРИ ЗАГРУЗКЕ ----------
  (function () {
    const bar = document.getElementById('gift1-bar');
    const percentLabel = document.getElementById('gift1-percent');
    if (!bar) return;

    const complete = parseInt(bar.dataset.complete || '0', 10);

    // стартуем с 0, а затем анимируем до server-side значения
    bar.style.width = '0%';
    if (percentLabel) {
      percentLabel.textContent = complete + '%';
    }

    requestAnimationFrame(() => {
      bar.style.width = complete + '%';
    });
  })();

  (function () {
    const input = document.getElementById('gift1Input');
    const btn = document.getElementById('gift1SubmitBtn');
    const err = document.getElementById('gift1Error');
    const bar = document.getElementById('gift1-bar');
    const percentLabel = document.getElementById('gift1-percent');
    const finalBlock = document.getElementById('gift1Final');
    const stage2Block = document.getElementById('gift1Stage2');
    const stage3Block = document.getElementById('gift1Stage3');

    if (!btn || !bar || !percentLabel) return;

    const step1Url = btn.dataset.step1Url || '';
    const step2Url = btn.dataset.step2Url || '';
    const vinUrl = btn.dataset.vinUrl || '';

    // по умолчанию — этап 1
    let stage = 1;
    let finished = false;

    // определяем начальную стадию по тому, что уже показал сервер
    if (finalBlock && !finalBlock.classList.contains('hidden')) {
      stage = 3;
      finished = true;
    } else if (stage3Block && !stage3Block.classList.contains('hidden')) {
      stage = 3;
    } else if (stage2Block && !stage2Block.classList.contains('hidden')) {
      stage = 2;
    }

    // получаем текст финального сообщения (если оно уже есть)
    function getFinalTextFromDom() {
      if (!finalBlock) return '';
      const textEl = finalBlock.querySelector('[data-final-text]');
      return textEl ? textEl.textContent.trim() : '';
    }

    // подправляем плейсхолдер под текущую стадию
    function updatePlaceholder() {
      if (!input) return;

      if (finished) {
        const finalText = getFinalTextFromDom();
        input.placeholder = finalText || 'Дабл ю Дабл ю! Подарок лежит, где аптечка в машине - тут скажет Юля, где искать. 🎁';
      } else if (stage === 2) {
        input.placeholder = 'Этап 2: пароль от первой БД';
      } else if (stage === 3) {
        input.placeholder = 'Этап 3: VIN газели';
      } else {
        input.placeholder = 'Этап 1: адрес без пробелов';
      }
    }

    updatePlaceholder();

    // если уже финиш – блокируем ввод
    function applyFinishedState() {
      if (!input || !btn) return;
      if (finished) {
        input.value = '';
        input.disabled = true;
        btn.disabled = true;
      } else {
        input.disabled = false;
        btn.disabled = false;
      }
      updatePlaceholder();
    }

    applyFinishedState();

    function setStage1Done() {
      bar.style.width = '33%';
      percentLabel.textContent = '33%';
      stage = 2;

      if (stage2Block) stage2Block.classList.remove('hidden');

      if (input) {
        input.value = '';
      }
      if (err) {
        err.textContent = 'Этап 1 пройден! Теперь введи пароль от первой БД.';
      }
      updatePlaceholder();
    }

    function setStage2Done() {
      bar.style.width = '66%';
      percentLabel.textContent = '66%';
      stage = 3;

      if (stage3Block) stage3Block.classList.remove('hidden');

      if (input) {
        input.value = '';
      }
      if (err) {
        err.textContent = 'Этап 2 пройден! Теперь введи VIN газели.';
      }
      updatePlaceholder();
    }

    function setFinalDone(finalTextFromServer) {
      bar.style.width = '100%';
      percentLabel.textContent = '100%';

      if (stage2Block) stage2Block.classList.remove('hidden');
      if (stage3Block) stage3Block.classList.remove('hidden');

      let finalText = finalTextFromServer || '';

      if (finalBlock) {
        finalBlock.classList.remove('hidden');
        const textEl = finalBlock.querySelector('[data-final-text]');
        if (finalTextFromServer && textEl) {
          textEl.textContent = finalTextFromServer;
        }
        if (!finalText && textEl) {
          finalText = textEl.textContent.trim();
        }
      }

      finished = true;
      if (err) err.textContent = '';
      applyFinishedState();
    }

    // ENTER
    btn.addEventListener('click', () => {
      if (finished) {
        // уже всё разгадано — не стреляем запросами лишний раз
        return;
      }

      if (err) err.textContent = '';

      const value = (input && input.value ? input.value : '').trim();
      if (!value) {
        if (err) err.textContent = 'Введите значение.';
        return;
      }

      let url = '';
      let payload;

      if (stage === 1) {
        url = step1Url;
        payload = new URLSearchParams({ code: value });
      } else if (stage === 2) {
        url = step2Url;
        payload = new URLSearchParams({ password: value });
      } else {
        url = vinUrl;
        payload = new URLSearchParams({ vin: value });
      }

      if (!url) {
        if (err) err.textContent = 'Не настроен адрес проверки кода.';
        return;
      }

      fetch(url, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrftoken || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload
      })
        .then(r => r.json())
        .then(data => {
          if (data.ok) {
            if (stage === 1) {
              setStage1Done();
            } else if (stage === 2) {
              setStage2Done();
            } else {
              setFinalDone(data.final_text);
            }
          } else {
            if (err) {
              if (stage === 1) {
                err.textContent = 'Неверный адрес. Введи адрес без пробелов.';
              } else if (stage === 2) {
                err.textContent = 'Неверный пароль от БД. Подумай ещё.';
              } else {
                err.textContent = 'Неверный VIN. Попробуй ещё раз.';
              }
            }
          }
        })
        .catch(() => {
          if (err) {
            err.textContent = 'Системная ошибка. Попробуй ещё раз.';
          }
        });
    });

    // ENCODE TEST — СБРОС
    const testBtn = document.getElementById('decodeTestBtn');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        const allBars = document.querySelectorAll('.progress-inner');
        const allPercents = document.querySelectorAll('.progress-label span:last-child');

        allBars.forEach(b => { b.style.width = '0%'; });
        allPercents.forEach(p => { p.textContent = '0%'; });

        if (bar) bar.style.width = '0%';
        if (percentLabel) percentLabel.textContent = '0%';

        if (stage2Block) stage2Block.classList.add('hidden');
        if (stage3Block) stage3Block.classList.add('hidden');
        if (finalBlock) finalBlock.classList.add('hidden');

        stage = 1;
        finished = false;

        if (input) {
          input.disabled = false;
          input.value = '';
        }
        if (btn) btn.disabled = false;
        if (err) err.textContent = '';

        updatePlaceholder();

        // чистим серверную сессию
        const resetUrl = testBtn.dataset.resetUrl || '';
        if (!resetUrl) return;

        fetch(resetUrl, {
          method: 'POST',
          headers: {
            'X-CSRFToken': csrftoken || '',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({})
        }).catch(() => { });
      });
    }
  })();

  // ---------- МОДАЛКА КОРЗИНЫ / УДАЛЁННЫЙ ФАЙЛ ----------
  (function () {
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
    // клик по фону закрывает модалку
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    submitBtn.addEventListener('click', () => {
      if (msg) {
        msg.textContent = '';
        msg.classList.remove('error');
      }
      if (content) content.style.display = 'none';

      const password = (passInput && passInput.value ? passInput.value : '').trim();
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
  })();

  // ---------- НАВИГАЦИЯ ПО ПАПКАМ В ЛЕВОЙ КОЛОНКЕ ----------
  (function () {
    const navItems = document.querySelectorAll('.folder-clickable[data-url]');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        if (url) {
          window.location.href = url;
        }
      });
    });
  })();
});
