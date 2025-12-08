from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard, name='dashboard'),

    path('evidence/photos/', views.evidence_photos, name='evidence_photos'),
    path('evidence/files/', views.evidence_files, name='evidence_files'),
    path('evidence/videos/', views.evidence_videos, name='evidence_videos'),

    path('api/gift1/step1/', views.gift1_step1, name='gift1_step1'),
    path('api/gift1/step2/', views.gift1_step2, name='gift1_step2'),

    path('api/check-vin/', views.check_vin, name='check_vin'),
    path('api/open-trash/', views.open_trash, name='open_trash'),
    path('api/reset-vin/', views.reset_vin, name='reset_vin'),

    path('api/gift2/step1/', views.gift2_step1, name='gift2_step1'),
    path('api/gift2/step2/', views.gift2_step2, name='gift2_step2'),
    path('api/gift2/step3/', views.gift2_step3, name='gift2_step3'),
]
