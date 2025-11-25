from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_POST

LOGIN_CODE = "fitbud2556"
GIFT1_STAGE1_CODE = "ГРЕКОВА5"
TRASH_PASSWORD = "),OK<A2Wbo^-#H"
VIN_CODE = "KMHR381ABMU202591"

def _normalize_code(value: str) -> str:
    return ''.join(value.split()).upper()


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
    request.session.pop('quest_logged_in', None)
    request.session.pop('gift1_done', None)

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
    if pwd == TRASH_PASSWORD:
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
    return JsonResponse({'ok': False, 'error': 'wrong_vin'})


def dashboard(request):
    guard = _require_quest_login(request)
    if guard:
        return guard

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

    context = {
        'gift1_done': gift1_done,
        'gift1_stage1': gift1_stage1,
        'gift1_stage2': gift1_stage2,
        'gift1_progress': gift1_progress,
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
    return render(request, 'quest/evidence_photos.html', {
        'active_section': 'photos',
    })


def evidence_files(request):
    guard = _require_quest_login(request)
    if guard:
        return guard
    return render(request, 'quest/evidence_files.html', {
        'active_section': 'files',
    })


def evidence_videos(request):
    guard = _require_quest_login(request)
    if guard:
        return guard
    return render(request, 'quest/evidence_videos.html', {
        'active_section': 'videos',
    })


@require_POST
def open_trash(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    pwd = request.POST.get('password', '').strip()
    if pwd == TRASH_PASSWORD:
        return JsonResponse({
            'ok': True,
            'message': 'Удалённый файл восстановлен.',
            'vin_audio_url': '/static/quest/audio/vin-record.mp3',
        })
    return JsonResponse({'ok': False, 'error': 'wrong_password'})


@require_POST
def reset_vin(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    for key in ['gift1_stage1', 'gift1_stage2', 'gift1_done']:
        request.session.pop(key, None)

    return JsonResponse({'ok': True})
