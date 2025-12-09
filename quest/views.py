import re
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import EvidenceItem, TrashMessage

LOGIN_CODE = "fitbud2556"
GIFT1_STAGE1_CODE = "ГРЕКОВА5"
BD_PASSWORD = "),OK<A2Wbo^-#H"
VIN_CODE = "KMHR381ABMU202591"
TRASH_PASSWORD = "solo322"


def _normalize_code(value: str) -> str:
    return ''.join(value.split()).upper()


def normalize_pw(pw: str) -> str:
    if not pw:
        return ""

    pw = pw.strip().lower()

    ru_to_en = {
        "а": "a",
        "б": "b",
        "в": "v",
        "г": "g",
        "д": "d",
        "е": "e",
        "ё": "e",
        "ж": "zh",
        "з": "z",
        "и": "i",
        "й": "i",
        "к": "k",
        "л": "l",
        "м": "m",
        "н": "n",
        "о": "o",
        "п": "p",
        "р": "r",
        "с": "s",
        "т": "t",
        "у": "u",
        "ф": "f",
        "х": "h",
        "ц": "c",
        "ч": "ch",
        "ш": "sh",
        "щ": "shch",
        "ъ": "",
        "ы": "y",
        "ь": "",
        "э": "e",
        "ю": "yu",
        "я": "ya",
    }
    return "".join(ru_to_en.get(ch, ch) for ch in pw)


def _is_fav_game_ok(value: str) -> bool:
    code = _normalize_code(value)
    allowed = {
        "SIMS", "SIMS4", "THESIMS", "THESIMS4",
        "СИМС", "СИМС4",
    }
    return code in allowed


def _is_megatron_ok(value: str) -> bool:
    code = _normalize_code(value)
    return code in {"МЕГАТРОН", "MEGATRON"}


def _is_photo_choice_ok(value: str) -> bool:
    code = _normalize_code(value)
    return code in {"ПОЧЕШЕМ"}


def _is_gift3_step1_ok(value: str) -> bool:
    if not value:
        return False
    v = value.strip().lower()

    if v == '3':
        return True

    letters = re.sub(r'[^а-яёa-z]', '', v)
    return letters in {'три', 'three'}


def _normalize_rus_word(s: str) -> str:
    s = s or ''
    s = re.sub(r'[^А-Яа-яЁё]', '', s)
    return s.upper()


def _is_gift3_step2_ok(value: str) -> bool:
    norm = _normalize_rus_word(value)
    return norm.startswith('ОБМАН')


def _normalize_phrase(s: str) -> str:
    s = s or ''
    s = s.lower()
    s = re.sub(r'[^a-zа-яё0-9\s]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def _is_gift3_step3_ok(value: str) -> bool:
    return _normalize_phrase(value) == 'привет хорошего дня'


def _require_quest_login(request):
    if not request.session.get('quest_logged_in'):
        return redirect('login')
    return None


def login_view(request):
    if request.session.get('quest_logged_in'):
        return redirect('dashboard')

    error = ''
    if request.method == 'POST':
        code = request.POST.get('access_code', '').strip()
        if code == LOGIN_CODE:
            request.session['quest_logged_in'] = True
            return redirect('dashboard')
        else:
            error = 'Неверный код доступа. Попробуй ещё.'
    return render(request, 'quest/login.html', {'error': error})


def logout_view(request):
    for key in [
        'quest_logged_in',
        'gift1_stage1', 'gift1_stage2', 'gift1_done',
        'gift2_stage1', 'gift2_stage2', 'gift2_done',
        'gift3_stage1', 'gift3_stage2', 'gift3_done',
        'gift4_stage1', 'gift4_stage2', 'gift4_done',
    ]:
        request.session.pop(key, None)
    return redirect('login')


@require_POST
def gift1_step1(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    raw = request.POST.get('code', '') or ''
    code = _normalize_code(raw)
    if code == GIFT1_STAGE1_CODE:
        request.session['gift1_stage1'] = True
        return JsonResponse({'ok': True})
    return JsonResponse({'ok': False, 'error': 'wrong_code'})


@require_POST
def gift1_step2(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    pwd = request.POST.get('password', '') or ''
    if pwd == BD_PASSWORD:
        request.session['gift1_stage2'] = True
        return JsonResponse({'ok': True})
    return JsonResponse({'ok': False, 'error': 'wrong_password'})


@require_POST
def check_vin(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    vin = request.POST.get('vin', '').strip().upper()
    if vin == VIN_CODE:
        request.session['gift1_done'] = True
        return JsonResponse({
            'ok': True,
            'final_text': 'Дабл ю дабл ю! Подарок лежит, где аптечка в машине, Юля подскажет🎁',
        })
    return JsonResponse({'ok': False, 'error': 'wrong_vin'})


def dashboard(request):
    guard = _require_quest_login(request)
    if guard:
        return guard

    # --- Подарок 1 ---
    gift1_done = request.session.get('gift1_done', False)
    gift1_stage1 = request.session.get('gift1_stage1', False)
    gift1_stage2 = request.session.get('gift1_stage2', False)

    if gift1_done:
        gift1_progress = 100
    elif gift1_stage2:
        gift1_progress = 66
    elif gift1_stage1:
        gift1_progress = 33
    else:
        gift1_progress = 0

    # --- Подарок 2 ---
    gift2_done = request.session.get('gift2_done', False)
    gift2_stage1 = request.session.get('gift2_stage1', False)
    gift2_stage2 = request.session.get('gift2_stage2', False)

    if gift2_done:
        gift2_progress = 100
    elif gift2_stage2:
        gift2_progress = 66
    elif gift2_stage1:
        gift2_progress = 33
    else:
        gift2_progress = 0

    # --- Подарок 3 ---
    gift3_done = request.session.get('gift3_done', False)
    gift3_stage1 = request.session.get('gift3_stage1', False)
    gift3_stage2 = request.session.get('gift3_stage2', False)

    if gift3_done:
        gift3_progress = 100
    elif gift3_stage2:
        gift3_progress = 66
    elif gift3_stage1:
        gift3_progress = 33
    else:
        gift3_progress = 0

    # --- Подарок 4 ---
    gift4_done = request.session.get('gift4_done', False)
    gift4_stage1 = request.session.get('gift4_stage1', False)
    gift4_stage2 = request.session.get('gift4_stage2', False)

    if gift4_done:
        gift4_progress = 100
    elif gift4_stage2:
        gift4_progress = 66
    elif gift4_stage1:
        gift4_progress = 33
    else:
        gift4_progress = 0

    context = {
        'gift1_done': gift1_done,
        'gift1_stage1': gift1_stage1,
        'gift1_stage2': gift1_stage2,
        'gift1_progress': gift1_progress,

        'gift2_done': gift2_done,
        'gift2_stage1': gift2_stage1,
        'gift2_stage2': gift2_stage2,
        'gift2_progress': gift2_progress,

        'gift3_done': gift3_done,
        'gift3_stage1': gift3_stage1,
        'gift3_stage2': gift3_stage2,
        'gift3_progress': gift3_progress,

        'gift4_done': gift4_done,
        'gift4_stage1': gift4_stage1,
        'gift4_stage2': gift4_stage2,
        'gift4_progress': gift4_progress,

        'vin_code_len': len(VIN_CODE),
        'vin_code': VIN_CODE,
        'trash_hint': 'Подсказка: посмотри название видоса в уликах.',
        'active_section': 'dashboard',
    }
    return render(request, 'quest/dashboard.html', context)


def evidence_photos(request):
    guard = _require_quest_login(request)
    if guard:
        return guard

    items = EvidenceItem.objects.filter(item_type=EvidenceItem.PHOTO)
    return render(request, 'quest/evidence_photos.html', {
        'active_section': 'photos',
        'items': items,
        'node_code': 'HNY-28893',
    })


def evidence_files(request):
    guard = _require_quest_login(request)
    if guard:
        return guard

    items = EvidenceItem.objects.filter(item_type=EvidenceItem.FILE)

    return render(request, 'quest/evidence_files.html', {
        'active_section': 'files',
        'items': items,
        'node_code': 'HNY-28893',
    })


def evidence_videos(request):
    guard = _require_quest_login(request)
    if guard:
        return guard

    items = EvidenceItem.objects.filter(item_type=EvidenceItem.VIDEO)
    return render(request, 'quest/evidence_videos.html', {
        'active_section': 'videos',
        'items': items,
        'node_code': 'HNY-28893',
    })


@require_POST
def open_trash(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)
    
    raw_pwd = request.POST.get('password', '') or ''

    if normalize_pw(raw_pwd) == normalize_pw(TRASH_PASSWORD):
        messages = TrashMessage.objects.all()
        msg_payload = []
        for m in messages:
            msg_payload.append({
                'id': m.id,
                'speaker': m.speaker,
                'title': m.title,
                'audio_url': m.audio.url,
            })

        return JsonResponse({
            'ok': True,
            'message': 'Удалённые записи восстановлены.',
            'messages': msg_payload,
        })
    return JsonResponse({'ok': False, 'error': 'Неверный пароль'})


@require_POST
def reset_vin(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    for key in list(request.session.keys()):
        if key.startswith('gift'):
            request.session.pop(key, None)
    return JsonResponse({'ok': True})


@require_POST
def gift2_step1(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    answer = request.POST.get('answer', '') or ''
    if _is_fav_game_ok(answer):
        request.session['gift2_stage1'] = True
        return JsonResponse({'ok': True})
    return JsonResponse({'ok': False, 'error': 'wrong_answer'})


@require_POST
def gift2_step2(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    answer = request.POST.get('answer', '') or ''
    if _is_megatron_ok(answer):
        request.session['gift2_stage2'] = True
        return JsonResponse({'ok': True})
    return JsonResponse({'ok': False, 'error': 'wrong_answer'})


@require_POST
def gift2_step3(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    answer = request.POST.get('answer', '') or ''
    if _is_photo_choice_ok(answer):
        request.session['gift2_done'] = True
        return JsonResponse({
            'ok': True,
            'final_text': (
                "Локация разблокирована! Твой подарок уже очень давно "
                "лежит в Figma - ищи его за логотипом 🎁"
            ),
        })
    return JsonResponse({'ok': False, 'error': 'wrong_answer'})


@require_POST
def gift3_step1(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    answer = request.POST.get('answer', '') or ''
    if _is_gift3_step1_ok(answer):
        request.session['gift3_stage1'] = True
        return JsonResponse({'ok': True})
    return JsonResponse({'ok': False, 'error': 'wrong_answer'})


@require_POST
def gift3_step2(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    answer = request.POST.get('answer', '') or ''
    if _is_gift3_step2_ok(answer):
        request.session['gift3_stage2'] = True
        return JsonResponse({'ok': True})
    return JsonResponse({'ok': False, 'error': 'wrong_answer'})


@require_POST
def gift3_step3(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    answer = request.POST.get('answer', '') or ''
    if _is_gift3_step3_ok(answer):
        request.session['gift3_done'] = True
        return JsonResponse({
            'ok': True,
            'final_text': (
                "И вам хорошего дня, Валерий! Финальная локация: самое холодное место в доме. Там ждёт "
                " очень узнаваемая коробка для Ники и Валеры. Внутри неё спрятаны сразу два подарка 🎁🎁"
            ),
        })
    return JsonResponse({'ok': False, 'error': 'wrong_answer'})


def _is_gift4_step1_ok(value: str) -> bool:
    code = _normalize_code(value or '')
    return code in {"ТЕННИС", "TENNIS"}


def _is_gift4_step2_ok(value: str) -> bool:
    digits = re.sub(r'\D', '', value or '')
    return digits == '42421'


def _is_gift4_step3_ok(value: str) -> bool:
    s = value or ''

    if _normalize_rus_word(s) == 'СТАВРОПОЛЬ':
        return True

    code = _normalize_code(s)
    if code in {'STAVROPOL', 'СТАВРОПОЛЬ'}:
        return True

    return False


@require_POST
def gift4_step1(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    answer = request.POST.get('answer', '') or ''
    if _is_gift4_step1_ok(answer):
        request.session['gift4_stage1'] = True
        return JsonResponse({'ok': True})
    return JsonResponse({'ok': False, 'error': 'wrong_answer'})


@require_POST
def gift4_step2(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    code = request.POST.get('code', '') or ''
    if _is_gift4_step2_ok(code):
        request.session['gift4_stage2'] = True
        return JsonResponse({'ok': True})
    return JsonResponse({'ok': False, 'error': 'wrong_code'})


@require_POST
def gift4_step3(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    answer = request.POST.get('answer', '') or ''
    if _is_gift4_step3_ok(answer):
        request.session['gift4_done'] = True
        return JsonResponse({
            'ok': True,
            'final_text': (
                "Протокол принят. Финальная локация зашифрована как модуль "
                "распределения корреспонденции в твоём подъезде — тот самый "
                "металлический ящик, куда обычно падают письма и счета. "
                "Ключ от нужного сектора на руках у Юли. Внутри ячейки тебя "
                "ждут сразу два подарка 🎁🎁"
            ),
        })
    return JsonResponse({'ok': False, 'error': 'wrong_answer'})


