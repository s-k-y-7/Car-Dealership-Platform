from django.urls import path
from .views import (
    CityListView, ShowroomListView, VehicleListView, VehicleDetailView,
    VehiclePriceBreakdownView, AdminVehicleListCreateView, AdminVehicleDetailView,
    AdminOnRoadPriceListCreateView, AdminOnRoadPriceDetailView,
    AdminShowroomListCreateView, AdminShowroomDetailView
)

urlpatterns = [
    # Public endpoints
    path('cities/', CityListView.as_view(), name='city-list'),
    path('showrooms/', ShowroomListView.as_view(), name='showroom-list'),
    path('vehicles/', VehicleListView.as_view(), name='vehicle-list'),
    path('vehicles/<str:id>/', VehicleDetailView.as_view(), name='vehicle-detail'),
    path('vehicles/<str:vehicle_id>/pricing/', VehiclePriceBreakdownView.as_view(), name='vehicle-pricing'),

    # Admin Management endpoints
    path('admin/vehicles/', AdminVehicleListCreateView.as_view(), name='admin-vehicle-list-create'),
    path('admin/vehicles/<int:id>/', AdminVehicleDetailView.as_view(), name='admin-vehicle-detail'),
    path('admin/pricing/', AdminOnRoadPriceListCreateView.as_view(), name='admin-pricing-list-create'),
    path('admin/pricing/<int:id>/', AdminOnRoadPriceDetailView.as_view(), name='admin-pricing-detail'),
    path('admin/showrooms/', AdminShowroomListCreateView.as_view(), name='admin-showroom-list-create'),
    path('admin/showrooms/<int:id>/', AdminShowroomDetailView.as_view(), name='admin-showroom-detail'),
]
