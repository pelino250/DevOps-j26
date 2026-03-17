"""Tests for Vehicle, StatusHistory, and VehicleDocument models."""

import datetime

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from authentication.models import Role, User
from fleet.models import (
    FuelType,
    StatusHistory,
    Vehicle,
    VehicleDocument,
    VehicleStatus,
)
from tenants.models import Tenant


@pytest.fixture()
def tenant(db):
    return Tenant.objects.create(name="Test Fleet Co", email="fleet@test.com")


@pytest.fixture()
def driver(tenant):
    return User.objects.create_user(
        username="driver1",
        email="driver1@test.com",
        password="pass1234",
        role=Role.DRIVER,
        tenant=tenant,
    )


@pytest.fixture()
def vehicle(tenant):
    return Vehicle.objects.create(
        tenant=tenant,
        make="Toyota",
        model="Hilux",
        year=2023,
        license_plate="RAB 123A",
        fuel_type=FuelType.DIESEL,
    )


# ---------------------------------------------------------------------------
# Vehicle creation
# ---------------------------------------------------------------------------


class TestVehicleCreation:
    def test_create_vehicle_with_required_fields(self, vehicle):
        assert vehicle.pk is not None
        assert vehicle.make == "Toyota"
        assert vehicle.model == "Hilux"
        assert vehicle.year == 2023
        assert vehicle.license_plate == "RAB 123A"
        assert vehicle.fuel_type == FuelType.DIESEL
        assert vehicle.status == VehicleStatus.ACTIVE
        assert vehicle.current_mileage == 0

    def test_vehicle_str(self, vehicle):
        assert str(vehicle) == "Toyota Hilux (RAB 123A)"

    def test_vehicle_optional_fields(self, tenant):
        v = Vehicle.objects.create(
            tenant=tenant,
            make="Nissan",
            model="NV200",
            year=2022,
            license_plate="RAC 456B",
            fuel_type=FuelType.PETROL,
            vin="1HGCM82633A004352",
            baseline_fuel_consumption=8.5,
            current_mileage=15000,
        )
        assert v.vin == "1HGCM82633A004352"
        assert v.baseline_fuel_consumption == 8.5
        assert v.current_mileage == 15000

    def test_duplicate_license_plate_same_tenant_raises(self, vehicle, tenant):
        with pytest.raises(IntegrityError):
            Vehicle.objects.create(
                tenant=tenant,
                make="Honda",
                model="Fit",
                year=2021,
                license_plate="RAB 123A",
                fuel_type=FuelType.PETROL,
            )

    def test_duplicate_plate_different_tenant_ok(self, vehicle):
        other = Tenant.objects.create(name="Other Co", email="other@test.com")
        v2 = Vehicle.objects.create(
            tenant=other,
            make="Honda",
            model="Fit",
            year=2021,
            license_plate="RAB 123A",
            fuel_type=FuelType.PETROL,
        )
        assert v2.pk is not None

    def test_duplicate_plate_allowed_after_soft_delete(self, vehicle, tenant):
        vehicle.soft_delete()
        v2 = Vehicle.objects.create(
            tenant=tenant,
            make="Honda",
            model="Fit",
            year=2021,
            license_plate="RAB 123A",
            fuel_type=FuelType.PETROL,
        )
        assert v2.pk is not None


# ---------------------------------------------------------------------------
# Soft-delete (inherited from TenantAwareModel)
# ---------------------------------------------------------------------------


class TestVehicleSoftDelete:
    def test_soft_delete_sets_deleted_at(self, vehicle):
        vehicle.soft_delete()
        vehicle.refresh_from_db()
        assert vehicle.is_deleted

    def test_active_excludes_soft_deleted(self, vehicle, tenant):
        Vehicle.objects.create(
            tenant=tenant, make="Ford", model="Ranger", year=2020,
            license_plate="RAD 789C", fuel_type=FuelType.DIESEL,
        )
        vehicle.soft_delete()
        active = Vehicle.objects.active().for_tenant(tenant)
        assert active.count() == 1

    def test_restore_clears_deleted_at(self, vehicle):
        vehicle.soft_delete()
        vehicle.restore()
        vehicle.refresh_from_db()
        assert not vehicle.is_deleted

    def test_hard_delete_removes_record(self, vehicle):
        pk = vehicle.pk
        vehicle.hard_delete()
        assert not Vehicle.objects.filter(pk=pk).exists()


# ---------------------------------------------------------------------------
# Status lifecycle
# ---------------------------------------------------------------------------


class TestVehicleStatusLifecycle:
    def test_valid_transition_active_to_maintenance(self, vehicle):
        vehicle.transition_status(VehicleStatus.MAINTENANCE)
        vehicle.refresh_from_db()
        assert vehicle.status == VehicleStatus.MAINTENANCE

    def test_valid_transition_maintenance_to_active(self, vehicle):
        vehicle.transition_status(VehicleStatus.MAINTENANCE)
        vehicle.transition_status(VehicleStatus.ACTIVE)
        vehicle.refresh_from_db()
        assert vehicle.status == VehicleStatus.ACTIVE

    def test_transition_to_sold_is_terminal(self, vehicle):
        vehicle.transition_status(VehicleStatus.SOLD)
        with pytest.raises(ValidationError, match="Cannot transition"):
            vehicle.transition_status(VehicleStatus.ACTIVE)

    def test_invalid_transition_raises(self, vehicle):
        # Active → Active is not valid
        with pytest.raises(ValidationError, match="Cannot transition"):
            vehicle.transition_status(VehicleStatus.ACTIVE)

    def test_transition_creates_status_history(self, vehicle):
        vehicle.transition_status(VehicleStatus.MAINTENANCE)
        history = StatusHistory.objects.filter(vehicle=vehicle)
        assert history.count() == 1
        entry = history.first()
        assert entry.old_status == VehicleStatus.ACTIVE
        assert entry.new_status == VehicleStatus.MAINTENANCE


# ---------------------------------------------------------------------------
# Driver assignment
# ---------------------------------------------------------------------------


class TestDriverAssignment:
    def test_assign_driver(self, vehicle, driver):
        vehicle.assigned_driver = driver
        vehicle.save()
        vehicle.refresh_from_db()
        assert vehicle.assigned_driver == driver

    def test_unassign_driver(self, vehicle, driver):
        vehicle.assigned_driver = driver
        vehicle.save()
        vehicle.assigned_driver = None
        vehicle.save()
        vehicle.refresh_from_db()
        assert vehicle.assigned_driver is None

    def test_driver_can_only_be_assigned_to_one_vehicle(self, vehicle, driver, tenant):
        vehicle.assigned_driver = driver
        vehicle.save()
        v2 = Vehicle.objects.create(
            tenant=tenant, make="Ford", model="Ranger", year=2020,
            license_plate="RAD 789C", fuel_type=FuelType.DIESEL,
        )
        with pytest.raises(IntegrityError):
            v2.assigned_driver = driver
            v2.save()


# ---------------------------------------------------------------------------
# VehicleDocument
# ---------------------------------------------------------------------------


class TestVehicleDocument:
    def test_create_document(self, vehicle):
        doc = VehicleDocument.objects.create(
            tenant=vehicle.tenant,
            vehicle=vehicle,
            document_type=VehicleDocument.DocumentType.INSURANCE,
            title="Motor Third Party",
            file_url="https://example.com/doc.pdf",
            expiry_date=datetime.date(2026, 12, 31),
        )
        assert doc.pk is not None
        assert str(doc) == "Motor Third Party (insurance)"

    def test_document_is_overdue(self, vehicle):
        doc = VehicleDocument.objects.create(
            tenant=vehicle.tenant,
            vehicle=vehicle,
            document_type=VehicleDocument.DocumentType.REGISTRATION,
            title="Registration Cert",
            expiry_date=datetime.date(2020, 1, 1),
        )
        assert doc.is_overdue is True

    def test_document_not_overdue(self, vehicle):
        doc = VehicleDocument.objects.create(
            tenant=vehicle.tenant,
            vehicle=vehicle,
            document_type=VehicleDocument.DocumentType.INSPECTION,
            title="Annual Inspection",
            expiry_date=datetime.date(2027, 12, 31),
        )
        assert doc.is_overdue is False

    def test_document_no_expiry_not_overdue(self, vehicle):
        doc = VehicleDocument.objects.create(
            tenant=vehicle.tenant,
            vehicle=vehicle,
            document_type=VehicleDocument.DocumentType.OTHER,
            title="Purchase Invoice",
        )
        assert doc.is_overdue is False

    def test_document_soft_delete(self, vehicle):
        doc = VehicleDocument.objects.create(
            tenant=vehicle.tenant,
            vehicle=vehicle,
            document_type=VehicleDocument.DocumentType.INSURANCE,
            title="Motor Third Party",
        )
        doc.soft_delete()
        doc.refresh_from_db()
        assert doc.is_deleted
