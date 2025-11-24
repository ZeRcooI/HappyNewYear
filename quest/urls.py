from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'), 
    path('dashboard/', views.dashboard, name='dashboard'),

    path('api/check-vin/', views.check_vin, name='check_vin'),
    path('api/open-trash/', views.open_trash, name='open_trash'),
    path('api/reset-vin/', views.reset_vin, name='reset_vin'),
]
