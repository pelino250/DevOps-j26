"""Customers app URL configuration."""

from django.urls import include, path
from rest_framework.routers import SimpleRouter

from customers.views import CustomerViewSet

router = SimpleRouter()
router.register(r"customers", CustomerViewSet, basename="customer")

urlpatterns = [
    path("", include(router.urls)),
]
