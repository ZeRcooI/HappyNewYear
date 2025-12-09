from django.contrib import admin
from .models import EvidenceItem


@admin.register(EvidenceItem)
class EvidenceItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'item_type', 'order', 'created_at')
    list_editable = ('order',)
    list_filter = ('item_type',)
    search_fields = ('title',)