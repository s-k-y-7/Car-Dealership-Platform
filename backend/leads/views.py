from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from .models import TestDriveBooking, Lead, LeadActivity, AIInteraction, LeadStatus, LeadPriority, LeadSource
from .serializers import (
    TestDriveBookingSerializer, LeadListSerializer,
    LeadDetailSerializer, LeadActivitySerializer
)
from vehicles.models import Vehicle, Showroom
from core.ai_service import generate_lead_summary, generate_first_reply_draft

User = get_user_model()


def auto_assign_lead(lead):
    """
    Automatic lead assignment using least-active-leads strategy.
    Finds active consultants and selects the one with the fewest open leads.
    """
    eligible_consultants = User.objects.filter(
        role='CONSULTANT',
        is_active=True,
        is_active_consultant=True
    ).annotate(
        open_leads_count=Count('assigned_leads', filter=~Q(assigned_leads__status__in=['WON', 'LOST']))
    ).order_by('open_leads_count', 'id')

    assigned_user = eligible_consultants.first()
    if assigned_user:
        lead.assigned_consultant = assigned_user
        lead.assigned_at = timezone.now()
        lead.status = LeadStatus.ASSIGNED
        lead.save(update_fields=['assigned_consultant', 'assigned_at', 'status'])
        
        LeadActivity.objects.create(
            lead=lead,
            performed_by=None,
            activity_type=LeadActivity.ActivityType.STATUS_CHANGE,
            details=f"Lead automatically assigned to {assigned_user.full_name or assigned_user.username} via least-active strategy (current active leads: {assigned_user.open_leads_count})."
        )
    return assigned_user


class TestDriveBookingCreateView(views.APIView):
    """
    Public test-drive booking endpoint.
    Creates booking, prevents slot collisions, creates lead, auto-assigns consultant.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TestDriveBookingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        booking = serializer.save()

        # Automatically create corresponding Lead
        vehicle = booking.vehicle
        lead = Lead.objects.create(
            source=LeadSource.TEST_DRIVE,
            customer_name=booking.customer_name,
            customer_phone=booking.customer_phone,
            customer_email=booking.customer_email,
            customer_city=booking.showroom.city.name,
            interested_vehicle=vehicle,
            test_drive_booking=booking,
            budget_range=f"₹{vehicle.ex_showroom_price:,.0f} (Ex-showroom)",
            requirements_notes=f"Test-drive request for {vehicle.brand} {vehicle.model_name} {vehicle.variant} at {booking.showroom.name} on {booking.preferred_date} ({booking.time_slot}). Customer notes: {booking.notes or 'None'}",
            status=LeadStatus.NEW,
            priority=LeadPriority.HOT,
            consent_data_processing=booking.consent_given
        )

        # Activity log
        LeadActivity.objects.create(
            lead=lead,
            activity_type=LeadActivity.ActivityType.TEST_DRIVE_BOOKED,
            details=f"VIP Test Drive booked for {booking.preferred_date} at {booking.showroom.name} ({booking.time_slot}). Ref: {booking.booking_reference}"
        )

        # Auto-assignment
        assigned_consultant = auto_assign_lead(lead)

        return Response({
            'message': 'Test drive booked successfully!',
            'booking_reference': booking.booking_reference,
            'lead_reference': lead.lead_reference,
            'assigned_consultant': assigned_consultant.full_name if assigned_consultant else 'Pending Assignment',
            'booking': TestDriveBookingSerializer(booking).data
        }, status=status.HTTP_201_CREATED)


class PublicEnquiryCreateView(views.APIView):
    """
    Public website enquiry or on-road price quote enquiry endpoint.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        customer_name = request.data.get('customer_name')
        customer_phone = request.data.get('customer_phone')
        customer_email = request.data.get('customer_email', '')
        customer_city = request.data.get('customer_city', 'Lucknow')
        vehicle_id = request.data.get('vehicle_id')
        source = request.data.get('source', LeadSource.WEBSITE_ENQUIRY)
        notes = request.data.get('notes', '')
        budget = request.data.get('budget', '')
        consent = request.data.get('consent_data_processing', True)

        if not customer_name or not customer_phone:
            return Response(
                {'detail': 'Customer name and phone number are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        vehicle = None
        if vehicle_id:
            try:
                vehicle = Vehicle.objects.get(id=vehicle_id) if str(vehicle_id).isdigit() else Vehicle.objects.get(stock_id=vehicle_id)
            except Vehicle.DoesNotExist:
                pass

        lead = Lead.objects.create(
            source=source,
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            customer_city=customer_city,
            interested_vehicle=vehicle,
            budget_range=budget or (f"₹{vehicle.ex_showroom_price:,.0f}" if vehicle else ''),
            requirements_notes=notes,
            status=LeadStatus.NEW,
            priority=LeadPriority.HOT if source == LeadSource.PRICE_QUOTE else LeadPriority.WARM,
            consent_data_processing=bool(consent)
        )

        LeadActivity.objects.create(
            lead=lead,
            activity_type=LeadActivity.ActivityType.NOTE_ADDED,
            details=f"New enquiry received via {lead.get_source_display()}."
        )

        assigned_consultant = auto_assign_lead(lead)

        return Response({
            'message': 'Enquiry received. Our specialist will contact you shortly.',
            'lead_reference': lead.lead_reference,
            'assigned_consultant': assigned_consultant.full_name if assigned_consultant else 'Under Assignment'
        }, status=status.HTTP_201_CREATED)


class LeadInboxDashboardView(views.APIView):
    """
    Lead Inbox & CRM Dashboard for Sales Consultants and Administrators.
    Provides KPIs, response timers, filters, and assigned lead lists.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ['CONSULTANT', 'ADMIN']:
            return Response({'detail': 'Access forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        # Base query: consultants see assigned leads; admins see all
        qs = Lead.objects.all().select_related('interested_vehicle', 'assigned_consultant', 'test_drive_booking')
        if user.role == 'CONSULTANT':
            qs = qs.filter(assigned_consultant=user)

        # Compute Dashboard KPIs for current scope
        total_assigned = qs.count()
        new_leads = qs.filter(status__in=[LeadStatus.NEW, LeadStatus.ASSIGNED]).count()
        contacted_leads = qs.filter(status=LeadStatus.CONTACTED).count()
        converted_leads = qs.filter(status=LeadStatus.WON).count()
        test_drive_leads = qs.filter(status=LeadStatus.TEST_DRIVE_SCHEDULED).count()

        # Pending responses: leads without first_response_at that are still open
        pending_responses = qs.filter(
            first_response_at__isnull=True,
            status__in=[LeadStatus.NEW, LeadStatus.ASSIGNED]
        ).count()

        # Overdue count
        overdue_leads = sum(1 for lead in qs if lead.is_response_overdue)

        # Filter params
        params = request.query_params
        status_param = params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())

        priority_param = params.get('priority')
        if priority_param:
            qs = qs.filter(priority=priority_param.upper())

        source_param = params.get('source')
        if source_param:
            qs = qs.filter(source=source_param.upper())

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(customer_name__icontains=search) |
                Q(customer_phone__icontains=search) |
                Q(customer_email__icontains=search) |
                Q(lead_reference__icontains=search) |
                Q(interested_vehicle__model_name__icontains=search)
            )

        serializer = LeadListSerializer(qs.order_by('-created_at')[:100], many=True)

        return Response({
            'kpis': {
                'total_assigned': total_assigned,
                'new_leads': new_leads,
                'pending_responses': pending_responses,
                'overdue_responses': overdue_leads,
                'contacted_leads': contacted_leads,
                'test_drive_scheduled': test_drive_leads,
                'converted_leads': converted_leads,
            },
            'leads': serializer.data
        })


class LeadDetailView(generics.RetrieveAPIView):
    queryset = Lead.objects.all().select_related('interested_vehicle', 'assigned_consultant', 'test_drive_booking')
    serializer_class = LeadDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_object(self):
        lead_id = self.kwargs.get('id')
        if str(lead_id).isdigit():
            lead = get_object_or_404(Lead, id=lead_id)
        else:
            lead = get_object_or_404(Lead, lead_reference=lead_id)

        user = self.request.user
        if user.role == 'CONSULTANT' and lead.assigned_consultant_id != user.id:
            # Sales consultants only access their assigned leads
            self.permission_denied(self.request, message="You are not authorized to view this lead.")
        return lead


class LeadStatusUpdateView(views.APIView):
    """
    Update lead status (e.g. from NEW/ASSIGNED to CONTACTED, NEGOTIATION, WON, LOST).
    Automatically records first_response_at on first contact.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id):
        lead = get_object_or_404(Lead, id=id)
        user = request.user
        if user.role == 'CONSULTANT' and lead.assigned_consultant_id != user.id:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        new_priority = request.data.get('priority')
        note = request.data.get('note', '')

        if new_status:
            old_status = lead.status
            lead.status = new_status
            
            # If changing to CONTACTED or beyond and first_response_at is not set, set it now!
            if not lead.first_response_at and new_status in [
                LeadStatus.CONTACTED, LeadStatus.TEST_DRIVE_SCHEDULED,
                LeadStatus.NEGOTIATION, LeadStatus.WON, LeadStatus.LOST
            ]:
                lead.first_response_at = timezone.now()

            LeadActivity.objects.create(
                lead=lead,
                performed_by=user,
                activity_type=LeadActivity.ActivityType.STATUS_CHANGE,
                details=f"Status changed from '{old_status}' to '{new_status}'. {note}".strip()
            )

        if new_priority:
            lead.priority = new_priority

        lead.save()
        return Response(LeadDetailSerializer(lead).data)


class LeadAddNoteView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        lead = get_object_or_404(Lead, id=id)
        user = request.user
        if user.role == 'CONSULTANT' and lead.assigned_consultant_id != user.id:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        note_text = request.data.get('note')
        if not note_text:
            return Response({'detail': 'Note content is required.'}, status=status.HTTP_400_BAD_REQUEST)

        activity = LeadActivity.objects.create(
            lead=lead,
            performed_by=user,
            activity_type=LeadActivity.ActivityType.NOTE_ADDED,
            details=note_text
        )

        return Response(LeadActivitySerializer(activity).data, status=status.HTTP_201_CREATED)


class LeadAISummaryView(views.APIView):
    """
    AI Action 1: Summarize buyer requirements from enquiries.
    Uses Groq LLM with transparent fallback when credentials missing.
    Never fabricates prices or vehicle availability.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        lead = get_object_or_404(Lead, id=id)
        user = request.user
        if user.role == 'CONSULTANT' and lead.assigned_consultant_id != user.id:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        result = generate_lead_summary(lead)

        # Record AI Interaction
        AIInteraction.objects.create(
            lead=lead,
            consultant=user,
            action_type=AIInteraction.ActionType.SUMMARY,
            prompt_context=f"Lead {lead.lead_reference}: {lead.customer_name}, {lead.interested_vehicle}",
            response_text=result['summary'],
            provider=result['provider'],
            model=result['model'],
            is_fallback=result['is_fallback']
        )

        # Log CRM Activity
        LeadActivity.objects.create(
            lead=lead,
            performed_by=user,
            activity_type=LeadActivity.ActivityType.AI_SUMMARY_GENERATED,
            details=f"AI requirements summary generated via {result['provider']}."
        )

        return Response(result)


class LeadAIDraftReplyView(views.APIView):
    """
    AI Action 2: Generate an editable, personalized first-reply draft.
    Never sends automatically; consultant must review and edit.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        lead = get_object_or_404(Lead, id=id)
        user = request.user
        if user.role == 'CONSULTANT' and lead.assigned_consultant_id != user.id:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        result = generate_first_reply_draft(lead, user)

        # Record AI Interaction
        AIInteraction.objects.create(
            lead=lead,
            consultant=user,
            action_type=AIInteraction.ActionType.FIRST_REPLY,
            prompt_context=f"Lead {lead.lead_reference}: {lead.customer_name}, Consultant {user.full_name}",
            response_text=result['draft'],
            provider=result['provider'],
            model=result['model'],
            is_fallback=result['is_fallback']
        )

        LeadActivity.objects.create(
            lead=lead,
            performed_by=user,
            activity_type=LeadActivity.ActivityType.FIRST_REPLY_DRAFTED,
            details=f"AI first-reply draft prepared via {result['provider']} for consultant review."
        )

        return Response(result)


class LeadReassignView(views.APIView):
    """
    Allows Admin or lead owner to manually reassign a lead to another consultant.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        lead = get_object_or_404(Lead, id=id)
        if request.user.role != 'ADMIN':
            return Response({'detail': 'Only administrators can reassign leads.'}, status=status.HTTP_403_FORBIDDEN)

        new_consultant_id = request.data.get('consultant_id')
        new_consultant = get_object_or_404(User, id=new_consultant_id, role='CONSULTANT')

        old_consultant = lead.assigned_consultant
        lead.assigned_consultant = new_consultant
        lead.assigned_at = timezone.now()
        lead.save()

        LeadActivity.objects.create(
            lead=lead,
            performed_by=request.user,
            activity_type=LeadActivity.ActivityType.STATUS_CHANGE,
            details=f"Lead reassigned from {old_consultant.full_name if old_consultant else 'Unassigned'} to {new_consultant.full_name} by Admin."
        )

        return Response({'message': f'Lead reassigned to {new_consultant.full_name}.'})
