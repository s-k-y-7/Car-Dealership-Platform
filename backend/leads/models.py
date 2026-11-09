from django.db import models
from django.utils import timezone
from django.conf import settings
from vehicles.models import Vehicle, Showroom, City
import uuid

class BookingStatus(models.TextChoices):
    REQUESTED = 'REQUESTED', 'Requested'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'


class LeadSource(models.TextChoices):
    TEST_DRIVE = 'TEST_DRIVE', 'Test Drive Booking'
    WEBSITE_ENQUIRY = 'WEBSITE_ENQUIRY', 'Website General Enquiry'
    PRICE_QUOTE = 'PRICE_QUOTE', 'On-Road Price Quote'
    USED_CAR_INQUIRY = 'USED_CAR_INQUIRY', 'Certified Used Car Enquiry'
    WALK_IN = 'WALK_IN', 'Showroom Walk-in'
    SOCIAL_MEDIA = 'SOCIAL_MEDIA', 'Digital Portal / Social Media'


class LeadStatus(models.TextChoices):
    NEW = 'NEW', 'New Enquiry'
    ASSIGNED = 'ASSIGNED', 'Assigned'
    CONTACTED = 'CONTACTED', 'Contacted'
    TEST_DRIVE_SCHEDULED = 'TEST_DRIVE_SCHEDULED', 'Test Drive Scheduled'
    NEGOTIATION = 'NEGOTIATION', 'Negotiation / Quoting'
    WON = 'WON', 'Deal Won (Booking Made)'
    LOST = 'LOST', 'Closed / Lost'


class LeadPriority(models.TextChoices):
    HOT = 'HOT', 'High (Ready to buy < 7 days)'
    WARM = 'WARM', 'Medium (Exploring 1-4 weeks)'
    COLD = 'COLD', 'Low (Future / Casual)'


class TestDriveBooking(models.Model):
    booking_reference = models.CharField(max_length=50, unique=True, db_index=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='test_drives')
    showroom = models.ForeignKey(Showroom, on_delete=models.CASCADE, related_name='test_drives')
    
    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField()
    
    preferred_date = models.DateField()
    time_slot = models.CharField(max_length=50)  # e.g., "10:00 AM - 11:00 AM"
    
    status = models.CharField(
        max_length=20,
        choices=BookingStatus.choices,
        default=BookingStatus.REQUESTED
    )
    notes = models.TextField(blank=True, default='')
    consent_given = models.BooleanField(default=True, help_text="Consent for test drive scheduling and follow up")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Prevent double booking of the same vehicle at the same showroom and time slot
        unique_together = ('vehicle', 'showroom', 'preferred_date', 'time_slot')
        ordering = ['-preferred_date', 'time_slot']

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            self.booking_reference = f"TD-{timezone.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_reference} | {self.vehicle.model_name} @ {self.showroom.name} on {self.preferred_date} ({self.time_slot})"


class Lead(models.Model):
    lead_reference = models.CharField(max_length=50, unique=True, db_index=True)
    source = models.CharField(max_length=30, choices=LeadSource.choices, default=LeadSource.WEBSITE_ENQUIRY)
    
    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True, default='')
    customer_city = models.CharField(max_length=100, default='Lucknow')
    
    interested_vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leads'
    )
    test_drive_booking = models.OneToOneField(
        TestDriveBooking,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lead'
    )
    
    budget_range = models.CharField(max_length=100, blank=True, default='')
    requirements_notes = models.TextField(blank=True, default='')
    
    status = models.CharField(
        max_length=30,
        choices=LeadStatus.choices,
        default=LeadStatus.NEW
    )
    priority = models.CharField(
        max_length=20,
        choices=LeadPriority.choices,
        default=LeadPriority.WARM
    )
    
    assigned_consultant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_leads'
    )
    assigned_at = models.DateTimeField(null=True, blank=True)
    first_response_at = models.DateTimeField(null=True, blank=True)
    response_due_minutes = models.PositiveIntegerField(default=30)
    
    consent_data_processing = models.BooleanField(default=True)
    opt_out_marketing = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.lead_reference:
            self.lead_reference = f"LD-{timezone.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
        super().save(*args, **kwargs)

    @property
    def is_response_overdue(self):
        """Returns True if the lead has not received a first response within response_due_minutes since creation/assignment."""
        if self.first_response_at or self.status in [LeadStatus.CONTACTED, LeadStatus.TEST_DRIVE_SCHEDULED, LeadStatus.WON, LeadStatus.LOST]:
            return False
        reference_time = self.assigned_at or self.created_at
        if not reference_time:
            return False
        delta = (timezone.now() - reference_time).total_seconds() / 60
        return delta > self.response_due_minutes

    @property
    def response_timer_minutes_left(self):
        """Minutes remaining before response target is breached, or negative if overdue."""
        if self.first_response_at or self.status in [LeadStatus.CONTACTED, LeadStatus.TEST_DRIVE_SCHEDULED, LeadStatus.WON, LeadStatus.LOST]:
            return None
        reference_time = self.assigned_at or self.created_at
        if not reference_time:
            return self.response_due_minutes
        elapsed = (timezone.now() - reference_time).total_seconds() / 60
        return round(self.response_due_minutes - elapsed, 1)

    def __str__(self):
        return f"{self.lead_reference} | {self.customer_name} ({self.get_status_display()})"


class LeadActivity(models.Model):
    class ActivityType(models.TextChoices):
        STATUS_CHANGE = 'STATUS_CHANGE', 'Status Changed'
        NOTE_ADDED = 'NOTE_ADDED', 'Note Added'
        AI_SUMMARY_GENERATED = 'AI_SUMMARY_GENERATED', 'AI Summary Generated'
        FIRST_REPLY_DRAFTED = 'FIRST_REPLY_DRAFTED', 'First Reply Drafted'
        CALL_LOGGED = 'CALL_LOGGED', 'Phone Call Logged'
        TEST_DRIVE_BOOKED = 'TEST_DRIVE_BOOKED', 'Test Drive Booked'

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='activities')
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    activity_type = models.CharField(max_length=30, choices=ActivityType.choices)
    details = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.lead.lead_reference} - {self.get_activity_type_display()} at {self.created_at}"


class AIInteraction(models.Model):
    class ActionType(models.TextChoices):
        SUMMARY = 'SUMMARY', 'Requirements Summary'
        FIRST_REPLY = 'FIRST_REPLY', 'First Reply Draft'

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='ai_interactions')
    consultant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=20, choices=ActionType.choices)
    prompt_context = models.TextField()
    response_text = models.TextField()
    provider = models.CharField(max_length=50, default='groq')
    model = models.CharField(max_length=100, default='llama-3.3-70b-versatile')
    is_fallback = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action_type} for {self.lead.lead_reference} ({self.provider})"
