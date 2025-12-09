from django.db import models


class EvidenceItem(models.Model):
    PHOTO = 'photo'
    VIDEO = 'video'
    FILE = 'file'

    TYPE_CHOICES = [
        (PHOTO, 'Фото'),
        (VIDEO, 'Видео'),
        (FILE, 'Файл'),
    ]

    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='evidence/')
    item_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=PHOTO)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.title} ({self.item_type})"