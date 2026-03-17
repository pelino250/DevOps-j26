"""Tests for DriverProfile model."""

from datetime import date, timedelta

import pytest
from django.core.exceptions import ValidationError

from authentication.models import Role, User
from fleet.models import DriverProfile
from tenants.models import Tenant


@pytest.fixture
def tenant():
    """Create a test tenant."""
    return Tenant.objects.create(name="Test Tenant", subdomain="test-tenant", email="test@example.com")


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


@pytest.mark.django_db
class TestDriverProfile:
    """Test suite for DriverProfile model."""

    def test_create_driver_profile(self, driver_user, tenant):
        """Test creating a driver profile with all required fields."""
        profile = DriverProfile.objects.create(
            tenant=tenant,
            user=driver_user,
            license_number="DL12345",
            license_expiry=date.today() + timedelta(days=365),
            license_class="Class 5",
            date_of_birth=date(1990, 1, 1),
            emergency_contact_name="Jane Doe",
            emergency_contact_phone="+1234567890",
        )

        assert profile.id is not None
        assert profile.user == driver_user
        assert profile.license_number == "DL12345"
        assert profile.tenant == tenant

    def test_driver_profile_str_representation(self, driver_user, tenant):
        """Test string representation of driver profile."""
        profile = DriverProfile.objects.create(
            tenant=tenant,
            user=driver_user,
            license_number="DL12345",
            license_expiry=date.today() + timedelta(days=365),
            license_class="Class 5",
            date_of_birth=date(1990, 1, 1),
            emergency_contact_name="Jane Doe",
            emergency_contact_phone="+1234567890",
        )

        assert str(profile) == "John Driver (DL12345)"

    def test_one_driver_profile_per_user(self, driver_user, tenant):
        """Test that a user can only have one driver profile."""
        DriverProfile.objects.create(
            tenant=tenant,
            user=driver_user,
            license_number="DL12345",
            license_expiry=date.today() + timedelta(days=365),
            license_class="Class 5",
            date_of_birth=date(1990, 1, 1),
            emergency_contact_name="Jane Doe",
            emergency_contact_phone="+1234567890",
        )

        # Attempting to create another profile for the same user should fail
        with pytest.raises(Exception):  # Will be IntegrityError
            DriverProfile.objects.create(
                tenant=tenant,
                user=driver_user,
                license_number="DL99999",
                license_expiry=date.today() + timedelta(days=365),
                license_class="Class 5",
                date_of_birth=date(1990, 1, 1),
                emergency_contact_name="Jane Doe",
                emergency_contact_phone="+1234567890",
            )

    def test_driver_profile_soft_delete(self, driver_user, tenant):
        """Test that driver profiles can be soft deleted."""
        profile = DriverProfile.objects.create(
            tenant=tenant,
            user=driver_user,
            license_number="DL12345",
            license_expiry=date.today() + timedelta(days=365),
            license_class="Class 5",
            date_of_birth=date(1990, 1, 1),
            emergency_contact_name="Jane Doe",
            emergency_contact_phone="+1234567890",
        )

        profile.soft_delete()
        assert profile.deleted_at is not None
        assert profile.is_deleted

    def test_driver_profile_notes_optional(self, driver_user, tenant):
        """Test that notes field is optional."""
        profile = DriverProfile.objects.create(
            tenant=tenant,
            user=driver_user,
            license_number="DL12345",
            license_expiry=date.today() + timedelta(days=365),
            license_class="Class 5",
            date_of_birth=date(1990, 1, 1),
            emergency_contact_name="Jane Doe",
            emergency_contact_phone="+1234567890",
            notes="",  # Empty notes should be fine
        )

        assert profile.notes == ""
