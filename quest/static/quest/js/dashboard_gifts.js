document.addEventListener('DOMContentLoaded', function () {
  const csrftoken = getCookie('csrftoken');

  // ---------- АНИМАЦИЯ ПРОГРЕСС-БАРА ПРИ ЗАГРУЗКЕ (ПОДАРОК #1) ----------
  (function () {
    const bar = document.getElementById('gift1-bar');
    const percentLabel = document.getElementById('gift1-percent');
    if (!bar) return;

    const complete = parseInt(bar.dataset.complete || '0', 10);

    bar.style.width = '0%';
    if (percentLabel) {
      percentLabel.textContent = complete + '%';
    }

    requestAnimationFrame(() => {
      bar.style.width = complete + '%';
    });
  })();

  // ---------- АНИМАЦИЯ ПРОГРЕСС-БАРА ПРИ ЗАГРУЗКЕ (ПОДАРОК #2) ----------
  (function () {
    const bar = document.getElementById('gift2-bar');
    const percentLabel = document.getElementById('gift2-percent');
    if (!bar) return;

    const complete = parseInt(bar.dataset.complete || '0', 10);

    bar.style.width = '0%';
    if (percentLabel) {
      percentLabel.textContent = complete + '%';
    }

    requestAnimationFrame(() => {
      bar.style.width = complete + '%';
    });
  })();

  // ---------- ПОДАРОК #1: АДРЕС / БД / VIN ----------
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

    let stage = 1;
    let finished = false;

    if (finalBlock && !finalBlock.classList.contains('hidden')) {
      stage = 3;
      finished = true;
    } else if (stage3Block && !stage3Block.classList.contains('hidden')) {
      stage = 3;
    } else if (stage2Block && !stage2Block.classList.contains('hidden')) {
      stage = 2;
    }

    function getFinalTextFromDom() {
      if (!finalBlock) return '';
      const textEl = finalBlock.querySelector('[data-final-text]');
      return textEl ? textEl.textContent.trim() : '';
    }

    function updatePlaceholder() {
      if (!input) return;
      if (finished) {
        const finalText = getFinalTextFromDom();
        input.placeholder =
          finalText ||
          'Дабл ю дабл ю! Подарок лежит, где аптечка в машине, Юля подскажет🎁';
      } else if (stage === 1) {
        input.placeholder = 'Этап 1: адрес без пробелов';
      } else if (stage === 2) {
        input.placeholder = 'Этап 2: пароль от первой БД';
      } else {
        input.placeholder = 'Этап 3: VIN газели';
      }
    }

    updatePlaceholder();

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

    btn.addEventListener('click', () => {
      if (finished) {
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
                err.textContent =
                  'Неверный адрес. Введи адрес без пробелов.';
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

    // Глобальный RESET (ENCODE TEST внизу)
    const testBtn = document.getElementById('decodeTestBtn');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        const allBars = document.querySelectorAll('.progress-inner');
        const allPercents = document.querySelectorAll(
          '.progress-label span:last-child'
        );

        // Обнуляем все прогресс-бары
        allBars.forEach(b => {
          b.style.width = '0%';
        });
        allPercents.forEach(p => {
          p.textContent = '0%';
        });

        // Сбрасываем Подарок 1
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

        // даём знать другим подаркам, что всё сброшено
        document.dispatchEvent(new Event('giftsReset'));

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

  // ---------- ПОДАРОК #2: 2D-ИГРОВОЙ КВЕСТ ----------
  (function () {
    const input = document.getElementById('gift2Input');
    const btn = document.getElementById('gift2SubmitBtn');
    const bar = document.getElementById('gift2-bar');
    const percentLabel = document.getElementById('gift2-percent');
    const stage2Block = document.getElementById('gift2Stage2');
    const stage3Block = document.getElementById('gift2Stage3');
    const finalBlock = document.getElementById('gift2Final');
    const err = document.getElementById('gift2Error');

    if (!btn || !bar || !percentLabel || !input) return;

    const step1Url = btn.dataset.g2Step1Url || '';
    const step2Url = btn.dataset.g2Step2Url || '';
    const step3Url = btn.dataset.g2Step3Url || '';

    let stage = 1;
    let finished = false;

    if (finalBlock && !finalBlock.classList.contains('hidden')) {
      stage = 3;
      finished = true;
    } else if (stage3Block && !stage3Block.classList.contains('hidden')) {
      stage = 3;
    } else if (stage2Block && !stage2Block.classList.contains('hidden')) {
      stage = 2;
    }

    function getFinalTextFromDom() {
      if (!finalBlock) return '';
      const textEl = finalBlock.querySelector('[data-final-text]');
      return textEl ? textEl.textContent.trim() : '';
    }

    function updatePlaceholder() {
      if (!input) return;
      if (finished) {
        const finalText = getFinalTextFromDom();
        input.placeholder = finalText || 'Квест пройден 🎁';
      } else if (stage === 1) {
        input.placeholder = 'Этап 1: любимая игра';
      } else if (stage === 2) {
        input.placeholder = 'Этап 2: имя ребёнка';
      } else {
        input.placeholder = 'Этап 3: слово с улики из конверта';
      }
    }

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

    function setStage1Done() {
      bar.style.width = '33%';
      percentLabel.textContent = '33%';
      stage = 2;
      if (stage2Block) stage2Block.classList.remove('hidden');
      if (input) input.value = '';
      if (err) err.textContent = 'Игра запущена! Теперь выдумываем имя 👶';
      updatePlaceholder();
    }

    function setStage2Done() {
      bar.style.width = '66%';
      percentLabel.textContent = '66%';
      stage = 3;
      if (stage3Block) stage3Block.classList.remove('hidden');
      if (input) input.value = '';
      if (err)
        err.textContent =
          'Имя принято! Теперь ищи конверт с уликами или в /evidence/photos.';
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
        if (textEl && finalText) {
          textEl.textContent = finalText;
        } else if (!finalText && textEl) {
          finalText = textEl.textContent.trim();
        }
      }

      finished = true;
      if (err) err.textContent = '';
      applyFinishedState();
    }

    updatePlaceholder();
    applyFinishedState();

    btn.addEventListener('click', () => {
      if (finished) return;
      if (err) err.textContent = '';

      const value = (input && input.value ? input.value : '').trim();
      if (!value) {
        if (err) err.textContent = 'Введите ответ.';
        return;
      }

      let url = '';
      if (stage === 1) {
        url = step1Url;
      } else if (stage === 2) {
        url = step2Url;
      } else {
        url = step3Url;
      }
      if (!url) {
        if (err) err.textContent = 'Не настроен адрес проверки ответа.';
        return;
      }

      const payload = new URLSearchParams({ answer: value });

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
            if (!err) return;
            if (stage === 1) {
              err.textContent = 'Не похоже на твою любимую игру 😏';
            } else if (stage === 2) {
              err.textContent =
                'Не то имя. Вспомни самого эпичного трансформера.';
            } else {
              err.textContent =
                'Не то слово. Посмотри ещё раз на фото с конвертом 😉';
            }
          }
        })
        .catch(() => {
          if (err) err.textContent = 'Системная ошибка. Попробуй ещё раз.';
        });
    });

    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btn.click();
        }
      });
    }

    // Реакция подарка 2 на глобальный RESET
    document.addEventListener('giftsReset', () => {
      stage = 1;
      finished = false;

      if (stage2Block) stage2Block.classList.add('hidden');
      if (stage3Block) stage3Block.classList.add('hidden');
      if (finalBlock) finalBlock.classList.add('hidden');

      if (bar) bar.style.width = '0%';
      if (percentLabel) percentLabel.textContent = '0%';

      if (input) {
        input.disabled = false;
        input.value = '';
      }
      if (btn) btn.disabled = false;
      if (err) err.textContent = '';

      updatePlaceholder();
    });
  })();

  // ---------- ПОДАРОК #3: ЛАМПЫ, КОРЗИНА И МАНТРА ----------
  (function () {
    const bar = document.getElementById('gift3-bar');
    const percentLabel = document.getElementById('gift3-percent');
    const input = document.getElementById('gift3Input');
    const btn = document.getElementById('gift3SubmitBtn');
    const err = document.getElementById('gift3Error');
    const stage2Block = document.getElementById('gift3Stage2');
    const stage3Block = document.getElementById('gift3Stage3');
    const finalBlock = document.getElementById('gift3Final');

    if (!bar || !btn || !input) return;

    let stage = 1;
    let finished = false;

    const complete = parseInt(bar.dataset.complete || '0', 10);
    bar.style.width = complete + '%';
    if (percentLabel) {
      percentLabel.textContent = complete + '%';
    }

    // определяем начальный stage по DOM
    if (finalBlock && !finalBlock.classList.contains('hidden')) {
      stage = 3;
      finished = true;
    } else if (stage3Block && !stage3Block.classList.contains('hidden')) {
      stage = 3;
    } else if (stage2Block && !stage2Block.classList.contains('hidden')) {
      stage = 2;
    }

    function getFinalTextFromDom() {
      if (!finalBlock) return '';
      const textEl = finalBlock.querySelector('[data-final-text]');
      return textEl ? textEl.textContent.trim() : '';
    }

    function updatePlaceholder() {
      if (!input) return;

      if (finished) {
        const finalText = getFinalTextFromDom();
        input.placeholder =
          finalText || 'Финальная подсказка для подарка #3 🎁';
      } else if (stage === 1) {
        input.placeholder = 'Этап 1: число ламп';
      } else if (stage === 2) {
        input.placeholder = 'Этап 2: причина одним словом';
      } else {
        input.placeholder = 'Этап 3: утренняя фраза';
      }
    }

    updatePlaceholder();

    const step1Url = btn.dataset.g3Step1Url || '';
    const step2Url = btn.dataset.g3Step2Url || '';
    const step3Url = btn.dataset.g3Step3Url || '';

    function setStage1Done() {
      bar.style.width = '33%';
      if (percentLabel) percentLabel.textContent = '33%';
      stage = 2;

      if (stage2Block) stage2Block.classList.remove('hidden');
      if (input) input.value = '';
      if (err)
        err.textContent =
          'Этап 1 пройден! Теперь слушаем корзину и пишем причину одним словом.';
      updatePlaceholder();
    }

    function setStage2Done() {
      bar.style.width = '66%';
      if (percentLabel) percentLabel.textContent = '66%';
      stage = 3;

      if (stage3Block) stage3Block.classList.remove('hidden');
      if (input) input.value = '';
      if (err)
        err.textContent =
          'Этап 2 пройден! Осталось вспомнить утреннюю мантру отдела найма.';
      updatePlaceholder();
    }

    function setFinalDone(finalTextFromServer) {
      bar.style.width = '100%';
      if (percentLabel) percentLabel.textContent = '100%';

      if (stage2Block) stage2Block.classList.remove('hidden');
      if (stage3Block) stage3Block.classList.remove('hidden');

      let finalText = finalTextFromServer || '';
      if (finalBlock) {
        finalBlock.classList.remove('hidden');
        const textEl = finalBlock.querySelector('[data-final-text]');
        if (textEl && finalText) {
          textEl.textContent = finalText;
        }
      }

      finished = true;
      if (input) input.value = '';
      if (err) err.textContent = 'Подарок #3 расшифрован 🎁';
      updatePlaceholder();
    }

    btn.addEventListener('click', () => {
      if (!input || !err) return;
      const value = input.value.trim();
      err.textContent = '';

      if (!value) {
        err.textContent = 'Нужно что-то ввести.';
        return;
      }

      let url = '';
      if (stage === 1) {
        url = step1Url;
      } else if (stage === 2) {
        url = step2Url;
      } else {
        url = step3Url;
      }

      if (!url) {
        err.textContent = 'Не настроен адрес проверки кода.';
        return;
      }

      const payload = new URLSearchParams({ answer: value });

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
            if (stage === 1) {
              err.textContent =
                'Не то число. Вспомни, сколько ламп реально ездит по потолку 😉';
            } else if (stage === 2) {
              err.textContent =
                'Не то слово. Сконцентрируйся на сути истории из корзины.';
            } else {
              err.textContent =
                'Не та фраза. Вспомни, с чего начинается каждое утро отдела найма.';
            }
          }
        })
        .catch(() => {
          err.textContent = 'Системная ошибка. Попробуй ещё раз.';
        });
    });

    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btn.click();
        }
      });
    }

    // Реакция подарка 3 на глобальный RESET
    document.addEventListener('giftsReset', () => {
      stage = 1;
      finished = false;

      if (stage2Block) stage2Block.classList.add('hidden');
      if (stage3Block) stage3Block.classList.add('hidden');
      if (finalBlock) finalBlock.classList.add('hidden');

      if (bar) bar.style.width = '0%';
      if (percentLabel) percentLabel.textContent = '0%';

      if (input) {
        input.disabled = false;
        input.value = '';
      }
      if (btn) btn.disabled = false;
      if (err) err.textContent = '';

      updatePlaceholder();
    });
  })();

  // ---------- ПОДАРОК #4: ТЕННИС, ТЕСТ И ЯЩИК ----------
  (function () {
    const bar = document.getElementById('gift4-bar');
    const percentLabel = document.getElementById('gift4-percent');
    const input = document.getElementById('gift4Input');
    const btn = document.getElementById('gift4SubmitBtn');
    const err = document.getElementById('gift4Error');
    const stage2Block = document.getElementById('gift4Stage2');
    const stage3Block = document.getElementById('gift4Stage3');
    const finalBlock = document.getElementById('gift4Final');

    if (!bar || !percentLabel || !btn || !input) return;

    // Инициализируем прогресс из data-атрибута
    const complete = parseInt(bar.dataset.complete || '0', 10);
    bar.style.width = complete + '%';
    percentLabel.textContent = complete + '%';

    // Определяем стартовый stage по DOM
    let stage = 1;
    let finished = false;

    if (finalBlock && !finalBlock.classList.contains('hidden')) {
      stage = 3;
      finished = true;
    } else if (stage3Block && !stage3Block.classList.contains('hidden')) {
      stage = 3;
    } else if (stage2Block && !stage2Block.classList.contains('hidden')) {
      stage = 2;
    }

    function getFinalTextFromDom() {
      if (!finalBlock) return '';
      const textEl = finalBlock.querySelector('[data-final-text]');
      return textEl ? textEl.textContent.trim() : '';
    }

    function updatePlaceholder() {
      if (!input) return;

      if (finished) {
        const finalText = getFinalTextFromDom();
        input.placeholder = finalText || 'Подарок #4 расшифрован 🎁';
      } else if (stage === 1) {
        input.placeholder = 'Этап 1: любимый вид спорта';
      } else if (stage === 2) {
        input.placeholder = 'Этап 2: проходится в тесте выше';
      } else {
        input.placeholder = 'Этап 3: город силы КАПСОМ';
      }
    }

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

    function setStage1Done() {
      bar.style.width = '33%';
      percentLabel.textContent = '33%';
      stage = 2;

      if (stage2Block) stage2Block.classList.remove('hidden');
      if (input) input.value = '';
      if (err)
        err.textContent =
          'Этап 1 пройден! Теперь запускай тест и собирай код домофона.';

      updatePlaceholder();
    }

    function setStage2Done() {
      bar.style.width = '66%';
      percentLabel.textContent = '66%';
      stage = 3;

      if (stage3Block) stage3Block.classList.remove('hidden');
      if (err)
        err.textContent =
          'Код домофона принят! Осталось назвать город силы.';

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
        if (textEl && finalText) {
          textEl.textContent = finalText;
        } else if (!finalText && textEl) {
          finalText = textEl.textContent.trim();
        }
      }

      finished = True;
      if (input) input.value = '';
      if (err) err.textContent = 'Подарок #4 расшифрован 🎁';
      updatePlaceholder();
      applyFinishedState();
    }

    updatePlaceholder();
    applyFinishedState();

    const step1Url = btn.dataset.g4Step1Url || '';
    const step3Url = btn.dataset.g4Step3Url || '';

    btn.addEventListener('click', () => {
      if (!input || !err) return;
      if (finished) return;

      const value = input.value.trim();
      err.textContent = '';

      if (!value) {
        err.textContent = 'Нужно что-то ввести.';
        return;
      }

      let url = '';
      let payload;

      if (stage === 1) {
        url = step1Url;
        payload = new URLSearchParams({ answer: value });
      } else if (stage === 2) {
        // На втором этапе всё делается через модалку-тест
        err.textContent = 'Пройди тест и введи код домофона в модалке.';
        return;
      } else {
        url = step3Url;
        payload = new URLSearchParams({ answer: value });
      }

      if (!url) {
        err.textContent = 'Не настроен адрес проверки ответа.';
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
            } else if (stage === 3) {
              setFinalDone(data.final_text);
            }
          } else {
            if (stage === 1) {
              err.textContent =
                'Не похоже на твой реальный любимый спорт. Подумай ещё 😉';
            } else if (stage === 3) {
              err.textContent =
                'Не тот город. Вспомни, откуда начинается вся твоя мощь.';
            }
          }
        })
        .catch(() => {
          err.textContent = 'Системная ошибка. Попробуй ещё раз.';
        });
    });

    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btn.click();
        }
      });
    }

    // ----- МОДАЛКА С ТЕСТОМ И ДОМОФОНОМ -----
    const quizModal = document.getElementById('gift4QuizModal');
    const quizOpenBtn = document.getElementById('gift4QuizOpenBtn');
    const quizClose = document.getElementById('gift4QuizClose');
    const codeDisplay = document.getElementById('gift4CodeDisplay');
    const keypadButtons = document.querySelectorAll('.gift4-keypad-btn[data-digit]');
    const codeClearBtn = document.getElementById('gift4CodeClearBtn');
    const codeOkBtn = document.getElementById('gift4CodeOkBtn');
    const quizMsg = document.getElementById('gift4QuizMessage');

    let codeDigits = [];

    function updateCodeDisplay() {
      if (!codeDisplay) return;
      if (!codeDigits.length) {
        codeDisplay.textContent = '_ _ _ _ _';
        return;
      }
      const filled = codeDigits
        .slice(0, 5)
        .map(d => d)
        .join(' ');
      const rest = Array(Math.max(0, 5 - codeDigits.length)).fill('_').join(' ');
      codeDisplay.textContent = rest ? `${filled} ${rest}` : filled;
    }

    function openQuizModal() {
      if (!quizModal) return;
      quizModal.classList.add('active');
      codeDigits = [];
      updateCodeDisplay();
      if (quizMsg) {
        quizMsg.textContent = '';
      }
    }

    function closeQuizModal() {
      if (!quizModal) return;
      quizModal.classList.remove('active');
    }

    if (quizOpenBtn && quizModal) {
      quizOpenBtn.addEventListener('click', () => {
        if (finished) return;
        openQuizModal();
      });
    }

    if (quizClose && quizModal) {
      quizClose.addEventListener('click', closeQuizModal);
      quizModal.addEventListener('click', e => {
        if (e.target === quizModal) closeQuizModal();
      });
    }

    if (keypadButtons && keypadButtons.length) {
      keypadButtons.forEach(btnDigit => {
        btnDigit.addEventListener('click', () => {
          const d = btnDigit.dataset.digit;
          if (!d) return;
          if (codeDigits.length >= 5) return;
          codeDigits.push(d);
          updateCodeDisplay();
        });
      });
    }

    if (codeClearBtn) {
      codeClearBtn.addEventListener('click', () => {
        codeDigits = [];
        updateCodeDisplay();
        if (quizMsg) quizMsg.textContent = '';
      });
    }

    if (codeOkBtn) {
      const step2Url = codeOkBtn.dataset.g4Step2Url || '';

      codeOkBtn.addEventListener('click', () => {
        if (!quizMsg) return;
        quizMsg.textContent = '';

        if (codeDigits.length !== 5) {
          quizMsg.textContent = 'Нужно ввести ровно 5 цифр.';
          return;
        }
        if (!step2Url) {
          quizMsg.textContent = 'Не настроен адрес проверки кода.';
          return;
        }

        const code = codeDigits.join('');
        const payload = new URLSearchParams({ code: code });

        fetch(step2Url, {
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
              quizMsg.textContent = 'Код принят. Переходим к городу силы.';
              setStage2Done();
              // Можно чуть подождать и закрыть модалку
              setTimeout(closeQuizModal, 800);
            } else {
              quizMsg.textContent =
                'Неверный код домофона. Проверь, какими по счёту были правильные варианты.';
            }
          })
          .catch(() => {
            quizMsg.textContent = 'Системная ошибка. Попробуй ещё.';
          });
      });
    }

    // Реакция подарка 4 на глобальный RESET
    document.addEventListener('giftsReset', () => {
      stage = 1;
      finished = false;

      if (stage2Block) stage2Block.classList.add('hidden');
      if (stage3Block) stage3Block.classList.add('hidden');
      if (finalBlock) finalBlock.classList.add('hidden');

      bar.style.width = '0%';
      percentLabel.textContent = '0%';

      if (input) {
        input.disabled = false;
        input.value = '';
      }
      if (btn) btn.disabled = false;
      if (err) err.textContent = '';

      if (quizMsg) quizMsg.textContent = '';
      codeDigits = [];
      updateCodeDisplay();

      updatePlaceholder();
    });
  })();
});
