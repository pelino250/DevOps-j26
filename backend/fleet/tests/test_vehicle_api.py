"""Tests for Vehicle API endpoints — CRUD, status, driver, mileage, documents, search/filter."""

import datetime

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from authentication.models import Role, User
from fleet.models import FuelType, Vehicle, VehicleDocument, VehicleStatus
from tenants.models import Tenant


@pytest.fixture()
def tenant(db):
    return Tenant.objects.create(name="Fleet Co", email="fleet@test.com")


@pytest.fixture()
def manager(tenant):
    user = User.objects.create_user(
        username="manager1", email="manager@test.com", password="pass1234",
        role=Role.MANAGER, tenant=tenant,
    )
    # Create auth token
    from rest_framework.authtoken.models import Token

    Token.objects.create(user=user)
    return user


@pytest.fixture()
def driver(tenant):
    user = User.objects.create_user(
        username="driver1", email="driver@test.com", password="pass1234",
        role=Role.DRIVER, tenant=tenant,
    )
    from rest_framework.authtoken.models import Token

    Token.objects.create(user=user)
    return user


@pytest.fixture()
def driver2(tenant):
    return User.objects.create_user(
        username="driver2", email="driver2@test.com", password="pass1234",
        role=Role.DRIVER, tenant=tenant,
    )


@pytest.fixture()
def other_tenant(db):
    return Tenant.objects.create(name="Other Co", email="other@test.com")


@pytest.fixture()
def other_user(other_tenant):
    user = User.objects.create_user(
        username="other1", email="other@test.com", password="pass1234",
        role=Role.MANAGER, tenant=other_tenant,
    )
    from rest_framework.authtoken.models import Token

    Token.objects.create(user=user)
    return user


@pytest.fixture()
def client(manager):
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f"Token {manager.auth_token.key}")
    return c


@pytest.fixture()
def vehicle(tenant):
    return Vehicle.objects.create(
        tenant=tenant, make="Toyota", model="Hilux", year=2023,
        license_plate="RAB 123A", fuel_type=FuelType.DIESEL,
    )


@pytest.fixture()
def vehicle_data():
    return {
        "make": "Nissan",
        "model": "NV200",
        "year": 2022,
        "license_plate": "RAC 456B",
        "fuel_type": "petrol",
    }


# ---------------------------------------------------------------------------
# Vehicle CRUD
# ---------------------------------------------------------------------------


class TestVehicleCRUD:
    def test_create_vehicle(self, client, vehicle_data):
        resp = client.post("/api/v1/vehicles/", vehicle_data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["make"] == "Nissan"
        assert resp.data["license_plate"] == "RAC 456B"

    def test_create_vehicle_duplicate_plate_returns_400(self, client, vehicle):
        data = {
            "make": "Honda", "model": "Fit", "year": 2021,
            "license_plate": "RAB 123A", "fuel_type": "petrol",
        }
        resp = client.post("/api/v1/vehicles/", data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_vehicles(self, client, vehicle):
        resp = client.get("/api/v1/vehicles/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1
        assert resp.data["results"][0]["license_plate"] == "RAB 123A"

    def test_retrieve_vehicle(self, client, vehicle):
        resp = client.get(f"/api/v1/vehicles/{vehicle.pk}/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["make"] == "Toyota"
        # Detail serializer includes documents and status_history
        assert "documents" in resp.data
        assert "status_history" in resp.data

    def test_update_vehicle(self, client, vehicle):
        resp = client.patch(
            f"/api/v1/vehicles/{vehicle.pk}/",
            {"current_mileage": 5000},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["current_mileage"] == 5000

    def test_delete_vehicle_soft_deletes(self, client, vehicle):
        resp = client.delete(f"/api/v1/vehicles/{vehicle.pk}/")
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        vehicle.refresh_from_db()
        assert vehicle.is_deleted

    def test_deleted_vehicle_not_in_list(self, client, vehicle):
        vehicle.soft_delete()
        resp = client.get("/api/v1/vehicles/")
        assert resp.data["count"] == 0

    def test_restore_vehicle(self, client, vehicle):
        vehicle.soft_delete()
        resp = client.post(f"/api/v1/vehicles/{vehicle.pk}/restore/")
        assert resp.status_code == status.HTTP_200_OK
        vehicle.refresh_from_db()
        assert not vehicle.is_deleted

    def test_unauthenticated_returns_401(self, vehicle):
        c = APIClient()
        resp = c.get("/api/v1/vehicles/")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# Tenant isolation
# ---------------------------------------------------------------------------


class TestVehicleTenantIsolation:
    def test_cannot_see_other_tenant_vehicles(self, client, other_tenant):
        Vehicle.objects.create(
            tenant=other_tenant, make="BMW", model="X5", year=2024,
            license_plate="RAZ 999X", fuel_type=FuelType.PETROL,
        )
        resp = client.get("/api/v1/vehicles/")
        assert resp.data["count"] == 0

    def test_other_tenant_cannot_access_vehicle(self, other_user, vehicle):
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION=f"Token {other_user.auth_token.key}")
        resp = c.get(f"/api/v1/vehicles/{vehicle.pk}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# Search and filters
# ---------------------------------------------------------------------------


class TestVehicleSearchFilter:
    def test_filter_by_status(self, client, vehicle, tenant):
        Vehicle.objects.create(
            tenant=tenant, make="Ford", model="Ranger", year=2020,
            license_plate="RAD 789C", fuel_type=FuelType.DIESEL,
            status=VehicleStatus.MAINTENANCE,
        )
        resp = client.get("/api/v1/vehicles/?status=maintenance")
        assert resp.data["count"] == 1
        assert resp.data["results"][0]["status"] == "maintenance"

    def test_filter_by_fuel_type(self, client, vehicle, tenant):
        Vehicle.objects.create(
            tenant=tenant, make="Tesla", model="Model 3", year=2024,
            license_plate="RAE 111E", fuel_type=FuelType.ELECTRIC,
        )
        resp = client.get("/api/v1/vehicles/?fuel_type=electric")
        assert resp.data["count"] == 1

    def test_search_by_make(self, client, vehicle):
        resp = client.get("/api/v1/vehicles/?search=Toyota")
        assert resp.data["count"] == 1

    def test_search_by_license_plate(self, client, vehicle):
        resp = client.get("/api/v1/vehicles/?search=RAB")
        assert resp.data["count"] == 1

    def test_search_no_match(self, client, vehicle):
        resp = client.get("/api/v1/vehicles/?search=ZZZZZ")
        assert resp.data["count"] == 0


# ---------------------------------------------------------------------------
# Status lifecycle API
# ---------------------------------------------------------------------------


class TestVehicleStatusAPI:
    def test_change_status_valid(self, client, vehicle):
        resp = client.patch(
            f"/api/v1/vehicles/{vehicle.pk}/status/",
            {"status": "maintenance"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == "maintenance"

    def test_change_status_invalid_returns_400(self, client, vehicle):
        resp = client.patch(
            f"/api/v1/vehicles/{vehicle.pk}/status/",
            {"status": "active"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_sold_is_terminal(self, client, vehicle):
        client.patch(f"/api/v1/vehicles/{vehicle.pk}/status/", {"status": "sold"}, format="json")
        resp = client.patch(
            f"/api/v1/vehicles/{vehicle.pk}/status/",
            {"status": "active"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Driver assignment API
# ---------------------------------------------------------------------------


class TestDriverAssignmentAPI:
    def test_assign_driver(self, client, vehicle, driver):
        resp = client.patch(
            f"/api/v1/vehicles/{vehicle.pk}/assign-driver/",
            {"driver_id": driver.pk},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["assigned_driver"] == driver.pk

    def test_assign_nonexistent_driver_returns_404(self, client, vehicle):
        resp = client.patch(
            f"/api/v1/vehicles/{vehicle.pk}/assign-driver/",
            {"driver_id": 99999},
            format="json",
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_assign_driver_already_assigned_returns_400(self, client, vehicle, driver, tenant):
        vehicle.assigned_driver = driver
        vehicle.save()
        v2 = Vehicle.objects.create(
            tenant=tenant, make="Ford", model="Ranger", year=2020,
            license_plate="RAD 789C", fuel_type=FuelType.DIESEL,
        )
        resp = client.patch(
            f"/api/v1/vehicles/{v2.pk}/assign-driver/",
            {"driver_id": driver.pk},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_unassign_driver(self, client, vehicle, driver):
        vehicle.assigned_driver = driver
        vehicle.save()
        resp = client.patch(f"/api/v1/vehicles/{vehicle.pk}/unassign-driver/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["assigned_driver"] is None


# ---------------------------------------------------------------------------
# Mileage API
# ---------------------------------------------------------------------------


class TestMileageAPI:
    def test_update_mileage(self, client, vehicle):
        resp = client.patch(
            f"/api/v1/vehicles/{vehicle.pk}/mileage/",
            {"mileage": 12500},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["current_mileage"] == 12500

    def test_update_mileage_invalid(self, client, vehicle):
        resp = client.patch(
            f"/api/v1/vehicles/{vehicle.pk}/mileage/",
            {"mileage": -100},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Vehicle documents API
# ---------------------------------------------------------------------------


class TestVehicleDocumentAPI:
    def test_create_document(self, client, vehicle):
        data = {
            "document_type": "insurance",
            "title": "Third Party Insurance",
            "file_url": "https://example.com/doc.pdf",
            "expiry_date": "2027-01-01",
        }
        resp = client.post(f"/api/v1/vehicles/{vehicle.pk}/documents/", data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["title"] == "Third Party Insurance"

    def test_list_documents(self, client, vehicle):
        VehicleDocument.objects.create(
            tenant=vehicle.tenant, vehicle=vehicle,
            document_type=VehicleDocument.DocumentType.INSURANCE,
            title="Insurance", file_url="https://example.com/ins.pdf",
        )
        resp = client.get(f"/api/v1/vehicles/{vehicle.pk}/documents/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["results"]) == 1

    def test_delete_document_soft_deletes(self, client, vehicle):
        doc = VehicleDocument.objects.create(
            tenant=vehicle.tenant, vehicle=vehicle,
            document_type=VehicleDocument.DocumentType.REGISTRATION,
            title="Registration",
        )
        resp = client.delete(f"/api/v1/vehicles/{vehicle.pk}/documents/{doc.pk}/")
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        doc.refresh_from_db()
        assert doc.is_deleted

    def test_overdue_flag_in_response(self, client, vehicle):
        VehicleDocument.objects.create(
            tenant=vehicle.tenant, vehicle=vehicle,
            document_type=VehicleDocument.DocumentType.INSPECTION,
            title="Past Inspection",
            expiry_date=datetime.date(2020, 1, 1),
        )
        resp = client.get(f"/api/v1/vehicles/{vehicle.pk}/documents/")
        assert resp.data["results"][0]["is_overdue"] is True
