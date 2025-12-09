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
    

class TrashMessage(models.Model):
    SPEAKER_A = 'A'
    SPEAKER_B = 'B'
    SPEAKER_CHOICES = [
        (SPEAKER_A, 'Собеседник A'),
        (SPEAKER_B, 'Собеседник B'),
    ]

    title = models.CharField(
        max_length=255,
        blank=True,
        help_text="Опционально – подпись/описание реплики",
    )
    audio = models.FileField(
        upload_to='trash_audio/',
        help_text="Голосовое сообщение (ogg/mp3/wav и т.п.)",
    )
    speaker = models.CharField(
        max_length=1,
        choices=SPEAKER_CHOICES,
        default=SPEAKER_A,
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Порядок в диалоге",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        who = dict(self.SPEAKER_CHOICES).get(self.speaker, '?')
        return f"{who}: {self.title or self.audio.name}"