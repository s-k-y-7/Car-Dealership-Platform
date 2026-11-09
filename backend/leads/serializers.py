from rest_framework import serializers
from .models import TestDriveBooking, Lead, LeadActivity, AIInteraction
from vehicles.serializers import VehicleListSerializer, ShowroomSerializer
from core.serializers import UserSerializer

class TestDriveBookingSerializer(serializers.ModelSerializer):
    vehicle_details = VehicleListSerializer(source='vehicle', read_only=True)
    showroom_details = ShowroomSerializer(source='showroom', read_only=True)

    class Meta:
        model = TestDriveBooking
        fields = [
            'id', 'booking_reference', 'vehicle', 'vehicle_details',
            'showroom', 'showroom_details', 'customer_name', 'customer_phone',
            'customer_email', 'preferred_date', 'time_slot', 'status',
            'notes', 'consent_given', 'created_at'
        ]
        read_only_fields = ['id', 'booking_reference', 'created_at']

    def validate(self, data):
        vehicle = data.get('vehicle')
        showroom = data.get('showroom')
        preferred_date = data.get('preferred_date')
        time_slot = data.get('time_slot')

        # Check for existing conflicting booking
        existing = TestDriveBooking.objects.filter(
            vehicle=vehicle,
            showroom=showroom,
            preferred_date=preferred_date,
            time_slot=time_slot,
            status__in=['REQUESTED', 'CONFIRMED']
        )
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)

        if existing.exists():
            raise serializers.ValidationError(
                "This demo car is already booked for the selected date and time slot at this showroom. Please choose an alternate slot."
            )

        if not data.get('consent_given', True):
            raise serializers.ValidationError("Consent to schedule test drive and process contact data is required.")

        return data


class LeadActivitySerializer(serializers.ModelSerializer):
    performer_name = serializers.CharField(source='performed_by.full_name', read_only=True)

    class Meta:
        model = LeadActivity
        fields = ['id', 'activity_type', 'details', 'performer_name', 'created_at']


class AIInteractionSerializer(serializers.ModelSerializer):
    consultant_name = serializers.CharField(source='consultant.full_name', read_only=True)

    class Meta:
        model = AIInteraction
        fields = ['id', 'action_type', 'prompt_context', 'response_text', 'provider', 'model', 'is_fallback', 'consultant_name', 'created_at']


class LeadListSerializer(serializers.ModelSerializer):
    vehicle_name = serializers.SerializerMethodField()
    consultant_name = serializers.CharField(source='assigned_consultant.full_name', read_only=True)
    is_response_overdue = serializers.BooleanField(read_only=True)
    response_timer_minutes_left = serializers.FloatField(read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'lead_reference', 'source', 'customer_name', 'customer_phone',
            'customer_email', 'customer_city', 'interested_vehicle', 'vehicle_name',
            'status', 'priority', 'assigned_consultant', 'consultant_name',
            'assigned_at', 'first_response_at', 'is_response_overdue',
            'response_timer_minutes_left', 'created_at'
        ]

    def get_vehicle_name(self, obj):
        if obj.interested_vehicle:
            return f"{obj.interested_vehicle.brand} {obj.interested_vehicle.model_name} {obj.interested_vehicle.variant}"
        return "General Enquiry"


class LeadDetailSerializer(serializers.ModelSerializer):
    vehicle_details = VehicleListSerializer(source='interested_vehicle', read_only=True)
    consultant_details = UserSerializer(source='assigned_consultant', read_only=True)
    test_drive_booking = TestDriveBookingSerializer(read_only=True)
    activities = LeadActivitySerializer(many=True, read_only=True)
    ai_interactions = AIInteractionSerializer(many=True, read_only=True)
    is_response_overdue = serializers.BooleanField(read_only=True)
    response_timer_minutes_left = serializers.FloatField(read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'lead_reference', 'source', 'customer_name', 'customer_phone',
            'customer_email', 'customer_city', 'interested_vehicle', 'vehicle_details',
            'test_drive_booking', 'budget_range', 'requirements_notes',
            'status', 'priority', 'assigned_consultant', 'consultant_details',
            'assigned_at', 'first_response_at', 'response_due_minutes',
            'is_response_overdue', 'response_timer_minutes_left',
            'consent_data_processing', 'opt_out_marketing',
            'activities', 'ai_interactions', 'created_at', 'updated_at'
        ]
