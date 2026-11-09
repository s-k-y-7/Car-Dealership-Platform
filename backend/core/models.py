from django.db import models
from django.contrib.auth.models import AbstractUser

class UserRole(models.TextChoices):
    BUYER = 'BUYER', 'Buyer'
    CONSULTANT = 'CONSULTANT', 'Sales Consultant'
    ADMIN = 'ADMIN', 'Administrator'

class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.BUYER
    )
    phone = models.CharField(max_length=20, blank=True, default='')
    full_name = models.CharField(max_length=150, blank=True, default='')
    is_active_consultant = models.BooleanField(default=True, help_text="Eligible for lead auto-assignment")

    def save(self, *args, **kwargs):
        if not self.full_name and (self.first_name or self.last_name):
            self.full_name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
