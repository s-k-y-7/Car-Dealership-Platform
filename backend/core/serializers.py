from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'phone', 'is_active_consultant']
        read_only_fields = ['id']


class ConsultantSummarySerializer(serializers.ModelSerializer):
    active_leads_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'phone', 'role', 'active_leads_count']
