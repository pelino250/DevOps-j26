"""Tests for Customer model and API — CRUD, search, summary, soft-delete."""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from authentication.models import Role, User
from customers.models import Customer, CustomerType
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
    from rest_framework.authtoken.models import Token

    Token.objects.create(user=user)
    return user


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
def customer(tenant):
    return Customer.objects.create(
        tenant=tenant,
        customer_type=CustomerType.INDIVIDUAL,
        name="John Doe",
        email="john@example.com",
        phone="+250788000000",
    )


@pytest.fixture()
def customer_data():
    return {
        "customer_type": "business",
        "name": "Acme Corp",
        "email": "acme@example.com",
        "phone": "+250788111111",
        "address": "Kigali, Rwanda",
        "tax_id": "RW123456",
        "contact_person": "Jane Smith",
    }


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------


class TestCustomerModel:
    def test_create_customer(self, customer):
        assert customer.pk is not None
        assert customer.name == "John Doe"
        assert customer.customer_type == CustomerType.INDIVIDUAL

    def test_str(self, customer):
        assert str(customer) == "John Doe (individual)"

    def test_soft_delete_and_restore(self, customer):
        customer.soft_delete()
        assert customer.is_deleted
        customer.restore()
        customer.refresh_from_db()
        assert not customer.is_deleted


# ---------------------------------------------------------------------------
# CRUD API tests
# ---------------------------------------------------------------------------


class TestCustomerCRUD:
    def test_create_customer(self, client, customer_data):
        resp = client.post("/api/v1/customers/", customer_data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["name"] == "Acme Corp"
        assert resp.data["customer_type"] == "business"

    def test_create_duplicate_email_returns_400(self, client, customer):
        data = {
            "customer_type": "individual",
            "name": "Jane Doe",
            "email": "john@example.com",
        }
        resp = client.post("/api/v1/customers/", data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_blank_email_ok(self, client, customer):
        data = {"customer_type": "individual", "name": "No Email"}
        resp = client.post("/api/v1/customers/", data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED

    def test_list_customers(self, client, customer):
        resp = client.get("/api/v1/customers/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1

    def test_retrieve_customer(self, client, customer):
        resp = client.get(f"/api/v1/customers/{customer.pk}/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == "John Doe"

    def test_update_customer(self, client, customer):
        resp = client.patch(
            f"/api/v1/customers/{customer.pk}/",
            {"phone": "+250788999999"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["phone"] == "+250788999999"

    def test_delete_customer_soft_deletes(self, client, customer):
        resp = client.delete(f"/api/v1/customers/{customer.pk}/")
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        customer.refresh_from_db()
        assert customer.is_deleted

    def test_deleted_customer_not_in_list(self, client, customer):
        customer.soft_delete()
        resp = client.get("/api/v1/customers/")
        assert resp.data["count"] == 0

    def test_restore_customer(self, client, customer):
        customer.soft_delete()
        resp = client.post(f"/api/v1/customers/{customer.pk}/restore/")
        assert resp.status_code == status.HTTP_200_OK
        customer.refresh_from_db()
        assert not customer.is_deleted


# ---------------------------------------------------------------------------
# Tenant isolation
# ---------------------------------------------------------------------------


class TestCustomerTenantIsolation:
    def test_cannot_see_other_tenant_customers(self, client, other_tenant):
        Customer.objects.create(
            tenant=other_tenant, customer_type=CustomerType.BUSINESS,
            name="Other Corp", email="other@corp.com",
        )
        resp = client.get("/api/v1/customers/")
        assert resp.data["count"] == 0


# ---------------------------------------------------------------------------
# Search & filter
# ---------------------------------------------------------------------------


class TestCustomerSearchFilter:
    def test_search_by_name(self, client, customer):
        resp = client.get("/api/v1/customers/?search=John")
        assert resp.data["count"] == 1

    def test_search_by_email(self, client, customer):
        resp = client.get("/api/v1/customers/?search=john@example")
        assert resp.data["count"] == 1

    def test_search_by_phone(self, client, customer):
        resp = client.get("/api/v1/customers/?search=0788")
        assert resp.data["count"] == 1

    def test_filter_by_type(self, client, customer, tenant):
        Customer.objects.create(
            tenant=tenant, customer_type=CustomerType.BUSINESS,
            name="Biz Co", email="biz@co.com",
        )
        resp = client.get("/api/v1/customers/?customer_type=business")
        assert resp.data["count"] == 1

    def test_search_no_match(self, client, customer):
        resp = client.get("/api/v1/customers/?search=ZZZZZ")
        assert resp.data["count"] == 0


# ---------------------------------------------------------------------------
# Summary endpoint
# ---------------------------------------------------------------------------


class TestCustomerSummary:
    def test_summary_returns_id_and_name_only(self, client, customer):
        resp = client.get("/api/v1/customers/summary/")
        assert resp.status_code == status.HTTP_200_OK
        # Summary is unpaginated — returns a list, not paginated object
        assert isinstance(resp.data, list)
        assert len(resp.data) == 1
        assert set(resp.data[0].keys()) == {"id", "name"}

    def test_summary_excludes_deleted(self, client, customer):
        customer.soft_delete()
        resp = client.get("/api/v1/customers/summary/")
        assert len(resp.data) == 0
