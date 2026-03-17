"""Tests for Trip model."""

from datetime import datetime, timedelta

import pytest
from django.core.exceptions import ValidationError

from authentication.models import Role, User
from fleet.models import FuelType, Trip, Vehicle
from tenants.models import Tenant


@pytest.fixture
def tenant():
    """Create a test tenant."""
    return Tenant.objects.create(
        name="Test Tenant",
        subdomain="test-tenant",
        email="test@example.com",
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


@pytest.mark.django_db
class TestTripModel:
    """Test suite for Trip model."""

    def test_create_trip(self, driver_user, vehicle, tenant):
        """Test creating a basic trip."""
        trip = Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=datetime.now(),
            start_mileage=50000,
            start_location="Kigali",
        )

        assert trip.id is not None
        assert trip.vehicle == vehicle
        assert trip.driver == driver_user
        assert trip.status == "in_progress"

    def test_trip_str_representation(self, driver_user, vehicle, tenant):
        """Test string representation of trip."""
        start_time = datetime.now()
        trip = Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=start_time,
            start_mileage=50000,
        )

        assert "Toyota Hilux" in str(trip)
        assert "John Driver" in str(trip)

    def test_complete_trip(self, driver_user, vehicle, tenant):
        """Test completing a trip."""
        trip = Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=datetime.now(),
            start_mileage=50000,
        )

        trip.end_time = datetime.now() + timedelta(hours=2)
        trip.end_mileage = 50250
        trip.status = "completed"
        trip.save()

        trip.refresh_from_db()
        assert trip.status == "completed"
        assert trip.end_mileage == 50250

    def test_trip_distance_km_property(self, driver_user, vehicle, tenant):
        """Test distance_km computed property."""
        trip = Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=datetime.now(),
            start_mileage=50000,
            end_mileage=50250,
        )

        assert trip.distance_km == 250

    def test_trip_distance_km_none_when_incomplete(self, driver_user, vehicle, tenant):
        """Test distance_km returns None when trip not completed."""
        trip = Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=datetime.now(),
            start_mileage=50000,
        )

        assert trip.distance_km is None

    def test_trip_duration_hours_property(self, driver_user, vehicle, tenant):
        """Test duration_hours computed property."""
        start = datetime.now()
        end = start + timedelta(hours=3, minutes=30)

        trip = Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=start,
            end_time=end,
            start_mileage=50000,
        )

        assert trip.duration_hours == pytest.approx(3.5, rel=0.01)

    def test_trip_duration_none_when_incomplete(self, driver_user, vehicle, tenant):
        """Test duration_hours returns None when trip not completed."""
        trip = Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=datetime.now(),
            start_mileage=50000,
        )

        assert trip.duration_hours is None

    def test_trip_soft_delete(self, driver_user, vehicle, tenant):
        """Test that trips can be soft deleted (cancelled)."""
        trip = Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=datetime.now(),
            start_mileage=50000,
        )

        trip.soft_delete()
        assert trip.deleted_at is not None
        assert trip.is_deleted

    def test_end_mileage_greater_than_start(self, driver_user, vehicle, tenant):
        """Test validation: end_mileage must be > start_mileage."""
        trip = Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=datetime.now(),
            start_mileage=50000,
            end_mileage=49000,  # Invalid: less than start
        )

        with pytest.raises(ValidationError):
            trip.full_clean()

    def test_end_time_after_start_time(self, driver_user, vehicle, tenant):
        """Test validation: end_time must be after start_time."""
        start = datetime.now()
        trip = Trip.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            driver=driver_user,
            start_time=start,
            end_time=start - timedelta(hours=1),  # Invalid: before start
            start_mileage=50000,
        )

        with pytest.raises(ValidationError):
            trip.full_clean()
