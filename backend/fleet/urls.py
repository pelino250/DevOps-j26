"""Fleet app URL configuration."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from fleet.views import DriverProfileViewSet, TripViewSet, VehicleDocumentViewSet, VehicleViewSet

router = DefaultRouter()
router.register(r"vehicles", VehicleViewSet, basename="vehicle")
router.register(r"drivers", DriverProfileViewSet, basename="driver")
router.register(r"trips", TripViewSet, basename="trip")

# Nested document routes
document_list = VehicleDocumentViewSet.as_view({"get": "list", "post": "create"})
document_detail = VehicleDocumentViewSet.as_view(
    {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
)

urlpatterns = [
    path("", include(router.urls)),
    path("vehicles/<int:vehicle_pk>/documents/", document_list, name="vehicle-document-list"),
    path("vehicles/<int:vehicle_pk>/documents/<int:pk>/", document_detail, name="vehicle-document-detail"),
]
