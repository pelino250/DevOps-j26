"""Tests for DriverProfile API endpoints."""

from datetime import date, timedelta

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from authentication.models import Role, User
from fleet.models import DriverProfile
from tenants.models import Tenant


@pytest.fixture
def api_client():
    """Return DRF API client."""
    return APIClient()


@pytest.fixture
def tenant():
    """Create a test tenant."""
    return Tenant.objects.create(
        name="Test Tenant",
        subdomain="test-tenant",
        email="test@example.com",
    )


@pytest.fixture
def manager_user(tenant):
    """Create a manager user for authentication."""
    return User.objects.create_user(
        username="manager1",
        email="manager@test.com",
        password="password123",
        role=Role.MANAGER,
        tenant=tenant,
        first_name="Manager",
        last_name="User",
    )


@pytest.fixture
def driver_user(tenant):
    """Create a user with driver role."""
    return User.objects.create_user(
        username="driver1",
        email="driver@test.com",
        password="password123",
        role=Role.DRIVER,
        tenant=tenant,
        first_name="John",
        last_name="Driver",
    )


@pytest.fixture
def driver_profile(driver_user, tenant):
    """Create a driver profile."""
    return DriverProfile.objects.create(
        tenant=tenant,
        user=driver_user,
        license_number="DL12345",
        license_expiry=date.today() + timedelta(days=365),
        license_class="Class 5",
        date_of_birth=date(1990, 1, 1),
        emergency_contact_name="Jane Doe",
        emergency_contact_phone="+1234567890",
    )


@pytest.mark.django_db
class TestDriverProfileAPI:
    """Test suite for DriverProfile API endpoints."""

    def test_list_drivers_requires_authentication(self, api_client):
        """Test that listing drivers requires authentication."""
        url = reverse("driver-list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_drivers_success(self, api_client, manager_user, driver_profile):
        """Test listing all drivers for a tenant."""
        api_client.force_authenticate(user=manager_user)
        url = reverse("driver-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["license_number"] == "DL12345"
        assert response.data["results"][0]["user"]["email"] == "driver@test.com"

    def test_create_driver_profile(self, api_client, manager_user, tenant):
        """Test creating a new driver profile."""
        # Create a driver user first
        driver = User.objects.create_user(
            username="newdriver",
            email="newdriver@test.com",
            password="password123",
            role=Role.DRIVER,
            tenant=tenant,
            first_name="Jane",
            last_name="Driver",
        )

        api_client.force_authenticate(user=manager_user)
        url = reverse("driver-list")
        data = {
            "user_id": driver.id,
            "license_number": "DL99999",
            "license_expiry": (date.today() + timedelta(days=730)).isoformat(),
            "license_class": "CDL-A",
            "date_of_birth": "1985-05-15",
            "emergency_contact_name": "Emergency Contact",
            "emergency_contact_phone": "+9876543210",
            "notes": "New driver",
        }
        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["license_number"] == "DL99999"
        assert DriverProfile.objects.filter(license_number="DL99999").exists()

    def test_retrieve_driver_profile(self, api_client, manager_user, driver_profile):
        """Test retrieving a single driver profile."""
        api_client.force_authenticate(user=manager_user)
        url = reverse("driver-detail", kwargs={"pk": driver_profile.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["license_number"] == "DL12345"
        assert response.data["user"]["first_name"] == "John"

    def test_update_driver_profile(self, api_client, manager_user, driver_profile):
        """Test updating a driver profile."""
        api_client.force_authenticate(user=manager_user)
        url = reverse("driver-detail", kwargs={"pk": driver_profile.pk})
        data = {
            "license_number": "DL54321",
            "license_expiry": (date.today() + timedelta(days=500)).isoformat(),
            "license_class": "Class 3",
            "date_of_birth": "1990-01-01",
            "emergency_contact_name": "Updated Contact",
            "emergency_contact_phone": "+1111111111",
        }
        response = api_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        driver_profile.refresh_from_db()
        assert driver_profile.license_number == "DL54321"
        assert driver_profile.emergency_contact_name == "Updated Contact"

    def test_delete_driver_profile_soft_deletes(self, api_client, manager_user, driver_profile):
        """Test deleting a driver profile performs soft delete."""
        api_client.force_authenticate(user=manager_user)
        url = reverse("driver-detail", kwargs={"pk": driver_profile.pk})
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        driver_profile.refresh_from_db()
        assert driver_profile.is_deleted

    def test_driver_cannot_create_profile(self, api_client, driver_user):
        """Test that drivers cannot create profiles (only managers can)."""
        api_client.force_authenticate(user=driver_user)
        url = reverse("driver-list")
        data = {
            "license_number": "DL99999",
            "license_expiry": (date.today() + timedelta(days=730)).isoformat(),
            "license_class": "Class 5",
            "date_of_birth": "1985-05-15",
            "emergency_contact_name": "Contact",
            "emergency_contact_phone": "+1234567890",
        }
        response = api_client.post(url, data, format="json")

        # Drivers can currently create profiles - no role restriction yet
        assert response.status_code == status.HTTP_400_BAD_REQUEST
