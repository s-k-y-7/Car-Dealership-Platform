from rest_framework import status, views, permissions
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from .serializers import UserSerializer, ConsultantSummarySerializer

User = get_user_model()

class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class ConsultantListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Only ADMIN or CONSULTANT can list consultants
        if request.user.role not in ['ADMIN', 'CONSULTANT']:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        consultants = User.objects.filter(role='CONSULTANT').annotate(
            active_leads_count=Count('assigned_leads', filter=~Q(assigned_leads__status__in=['WON', 'LOST']))
        ).order_by('full_name')
        
        serializer = ConsultantSummarySerializer(consultants, many=True)
        return Response(serializer.data)
