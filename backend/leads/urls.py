from django.urls import path
from .views import (
    TestDriveBookingCreateView, PublicEnquiryCreateView,
    LeadInboxDashboardView, LeadDetailView, LeadStatusUpdateView,
    LeadAddNoteView, LeadAISummaryView, LeadAIDraftReplyView, LeadReassignView,
    BuyerDashboardView, BuyerBookingListView, BuyerBookingCancelView,
    BuyerEnquiryListView, BuyerProfileUpdateView
)

urlpatterns = [
    # Public Lead & Booking Creation
    path('test-drive/', TestDriveBookingCreateView.as_view(), name='book-test-drive'),
    path('enquiry/', PublicEnquiryCreateView.as_view(), name='public-enquiry'),

    # Consultant & Admin CRM Endpoints
    path('inbox/', LeadInboxDashboardView.as_view(), name='lead-inbox-dashboard'),
    path('leads/<str:id>/', LeadDetailView.as_view(), name='lead-detail'),
    path('leads/<int:id>/status/', LeadStatusUpdateView.as_view(), name='lead-status-update'),
    path('leads/<int:id>/note/', LeadAddNoteView.as_view(), name='lead-add-note'),
    path('leads/<int:id>/ai-summary/', LeadAISummaryView.as_view(), name='lead-ai-summary'),
    path('leads/<int:id>/ai-draft/', LeadAIDraftReplyView.as_view(), name='lead-ai-draft'),
    path('leads/<int:id>/reassign/', LeadReassignView.as_view(), name='lead-reassign'),

    # Authenticated Buyer Portal Endpoints
    path('buyer/dashboard/', BuyerDashboardView.as_view(), name='buyer-dashboard'),
    path('buyer/bookings/', BuyerBookingListView.as_view(), name='buyer-bookings'),
    path('buyer/bookings/<int:id>/cancel/', BuyerBookingCancelView.as_view(), name='buyer-booking-cancel'),
    path('buyer/enquiries/', BuyerEnquiryListView.as_view(), name='buyer-enquiries'),
    path('buyer/profile/', BuyerProfileUpdateView.as_view(), name='buyer-profile-update'),
]
