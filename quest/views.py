from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_POST

LOGIN_CODE = "fitbud2556"
TRASH_PASSWORD = "),OK<A2Wbo^-#H"
VIN_CODE = "KMHR381ABMU202591"

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


def dashboard(request):
    if not request.session.get('quest_logged_in'):
        return redirect('login')

    gift1_done = request.session.get('gift1_done', False)

    context = {
        'gift1_done': gift1_done,
        'vin_code_len': len(VIN_CODE),
        'trash_hint': 'Подсказка: посмотри название видоса в уликах.',
    }
    return render(request, 'quest/dashboard.html', context)


@require_POST
def check_vin(request):
    if not request.session.get('quest_logged_in'):
        return JsonResponse({'ok': False, 'error': 'unauthorized'}, status=403)

    vin = request.POST.get('vin', '').strip().upper()
    if vin == VIN_CODE:
        request.session['gift1_done'] = True
        return JsonResponse({'ok': True})
    return JsonResponse({'ok': False})


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
    request.session['gift1_done'] = False
    return JsonResponse({'ok': True})