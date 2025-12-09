from django.contrib import admin
from .models import EvidenceItem, TrashMessage


@admin.register(EvidenceItem)
class EvidenceItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'item_type', 'order', 'created_at')
    list_editable = ('order',)
    list_filter = ('item_type',)
    search_fields = ('title',)


@admin.register(TrashMessage)
class TrashMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'speaker', 'order', 'created_at')
    list_editable = ('order', 'speaker')
    list_filter = ('speaker',)
    search_fields = ('title', 'audio')
