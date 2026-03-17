"""Tests for Trip API endpoints."""

from datetime import datetime, timedelta

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from authentication.models import Role, User
from fleet.models import FuelType, Trip, Vehicle
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
def vehicle(tenant):
    """Create a test vehicle."""
    return Vehicle.objects.create(
        tenant=tenant,
        make="Toyota",
        model="Hilux",
        year=2023,
        license_plate="RAB123A",
        fuel_type=FuelType.DIESEL,
        current_mileage=50000,
    )


@pytest.fixture
def trip(driver_user, vehicle, tenant):
    """Create a test trip."""
    return Trip.objects.create(
        tenant=tenant,
        vehicle=vehicle,
        driver=driver_user,
        start_time=datetime.now(),
        start_mileage=50000,
        start_location="Kigali",
    )


@pytest.mark.django_db
class TestTripAPI:
    """Test suite for Trip API endpoints."""

    def test_list_trips_requires_authentication(self, api_client):
        """Test that listing trips requires authentication."""
        url = reverse("trip-list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_trips_success(self, api_client, manager_user, trip):
        """Test listing all trips for a tenant."""
        api_client.force_authenticate(user=manager_user)
        url = reverse("trip-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["start_location"] == "Kigali"

    def test_create_trip(self, api_client, manager_user, driver_user, vehicle):
        """Test creating a new trip (starting a trip)."""
        api_client.force_authenticate(user=manager_user)
        url = reverse("trip-list")
        data = {
            "vehicle_id": vehicle.id,
            "driver_id": driver_user.id,
            "start_time": datetime.now().isoformat(),
            "start_mileage": 50000,
            "start_location": "Kigali",
            "purpose": "Customer delivery",
        }
        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == "in_progress"
        assert Trip.objects.filter(vehicle=vehicle).exists()

    def test_retrieve_trip(self, api_client, manager_user, trip):
        """Test retrieving a single trip."""
        api_client.force_authenticate(user=manager_user)
        url = reverse("trip-detail", kwargs={"pk": trip.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["start_location"] == "Kigali"
        assert response.data["vehicle"]["make"] == "Toyota"
        assert response.data["driver"]["first_name"] == "John"

    def test_update_trip(self, api_client, manager_user, trip):
        """Test updating a trip."""
        api_client.force_authenticate(user=manager_user)
        url = reverse("trip-detail", kwargs={"pk": trip.pk})
        data = {
            "purpose": "Updated purpose",
            "notes": "Added some notes",
        }
        response = api_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        trip.refresh_from_db()
        assert trip.purpose == "Updated purpose"
        assert trip.notes == "Added some notes"

    def test_complete_trip_action(self, api_client, manager_user, trip, vehicle):
        """Test completing a trip via custom action."""
        api_client.force_authenticate(user=manager_user)
        url = reverse("trip-complete", kwargs={"pk": trip.pk})
        data = {
            "end_time": (datetime.now() + timedelta(hours=2)).isoformat(),
            "end_mileage": 50250,
            "end_location": "Musanze",
            "fuel_consumed": 25.5,
        }
        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        trip.refresh_from_db()
        assert trip.status == "completed"
        assert trip.end_mileage == 50250
        assert trip.distance_km == 250

        # Verify vehicle mileage was updated
        vehicle.refresh_from_db()
        assert vehicle.current_mileage == 50250

    def test_cancel_trip(self, api_client, manager_user, trip):
        """Test cancelling a trip (soft delete)."""
        api_client.force_authenticate(user=manager_user)
        url = reverse("trip-detail", kwargs={"pk": trip.pk})
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        trip.refresh_from_db()
        assert trip.is_deleted

    def test_filter_trips_by_vehicle(self, api_client, manager_user, driver_user, vehicle, tenant):
        """Test filtering trips by vehicle."""
        # Create trips for two vehicles
        Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=datetime.now(),
            start_mileage=50000,
        )

        other_vehicle = Vehicle.objects.create(
            tenant=tenant,
            make="Honda",
            model="Civic",
            year=2022,
            license_plate="RAB456B",
            fuel_type=FuelType.PETROL,
            current_mileage=30000,
        )
        Trip.objects.create(
            tenant=tenant,
            vehicle=other_vehicle,
            driver=driver_user,
            start_time=datetime.now(),
            start_mileage=30000,
        )

        api_client.force_authenticate(user=manager_user)
        url = reverse("trip-list")
        response = api_client.get(url, {"vehicle": vehicle.id})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["vehicle"]["id"] == vehicle.id

    def test_filter_trips_by_driver(self, api_client, manager_user, driver_user, vehicle, tenant):
        """Test filtering trips by driver."""
        Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=datetime.now(),
            start_mileage=50000,
        )

        other_driver = User.objects.create_user(
            username="driver2",
            email="driver2@test.com",
            password="password123",
            role=Role.DRIVER,
            tenant=tenant,
        )
        Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=other_driver,
            start_time=datetime.now(),
            start_mileage=50100,
        )

        api_client.force_authenticate(user=manager_user)
        url = reverse("trip-list")
        response = api_client.get(url, {"driver": driver_user.id})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["driver"]["id"] == driver_user.id

    def test_filter_trips_by_status(self, api_client, manager_user, driver_user, vehicle, tenant):
        """Test filtering trips by status."""
        # Create in-progress trip
        Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=datetime.now(),
            start_mileage=50000,
        )

        # Create completed trip
        Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=datetime.now() - timedelta(days=1),
            end_time=datetime.now() - timedelta(hours=22),
            start_mileage=49000,
            end_mileage=49200,
            status="completed",
        )

        api_client.force_authenticate(user=manager_user)
        url = reverse("trip-list")
        response = api_client.get(url, {"status": "in_progress"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["status"] == "in_progress"
