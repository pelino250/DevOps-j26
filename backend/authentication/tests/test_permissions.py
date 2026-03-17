"""
Tests for RBAC DRF permission classes (#28).
RED step: written before permissions.py exists.
"""

from django.test import TestCase
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from authentication.models import Role, User
from tenants.models import Tenant

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

factory = APIRequestFactory()


def make_user(role: Role, tenant=None, email_suffix="") -> User:
    email = f"{role.value}{email_suffix}@test.com"
    return User.objects.create_user(
        email=email,
        username=email,
        password="pass",
        role=role,
        tenant=tenant,
    )


def make_tenant(name: str, subdomain: str) -> Tenant:
    return Tenant.objects.create(name=name, subdomain=subdomain, email=f"{subdomain}@t.com")


def make_request(user) -> Request:
    """
    Build a DRF Request with *user* pre-authenticated.
    Setting _user directly bypasses DRF's auth flow — suitable for unit tests.
    """
    raw = factory.get("/")
    req = Request(raw)
    req._user = user          # bypass DRF authentication
    return req


# ---------------------------------------------------------------------------
# IsSaaSAdmin
# ---------------------------------------------------------------------------

class TestIsSaaSAdmin(TestCase):
    def test_superadmin_has_permission(self):
        from authentication.permissions import IsSaaSAdmin
        user = make_user(Role.SUPERADMIN)
        self.assertTrue(IsSaaSAdmin().has_permission(make_request(user), None))

    def test_tenant_admin_denied(self):
        from authentication.permissions import IsSaaSAdmin
        tenant = make_tenant("T", "t1")
        user = make_user(Role.TENANT_ADMIN, tenant=tenant)
        self.assertFalse(IsSaaSAdmin().has_permission(make_request(user), None))

    def test_manager_denied(self):
        from authentication.permissions import IsSaaSAdmin
        tenant = make_tenant("T", "t2")
        user = make_user(Role.MANAGER, tenant=tenant)
        self.assertFalse(IsSaaSAdmin().has_permission(make_request(user), None))


# ---------------------------------------------------------------------------
# IsTenantAdmin
# ---------------------------------------------------------------------------

class TestIsTenantAdmin(TestCase):
    def test_tenant_admin_has_permission(self):
        from authentication.permissions import IsTenantAdmin
        tenant = make_tenant("TA", "ta1")
        user = make_user(Role.TENANT_ADMIN, tenant=tenant)
        self.assertTrue(IsTenantAdmin().has_permission(make_request(user), None))

    def test_saas_admin_has_permission(self):
        """SaaS admins can do anything a tenant admin can."""
        from authentication.permissions import IsTenantAdmin
        user = make_user(Role.SUPERADMIN)
        self.assertTrue(IsTenantAdmin().has_permission(make_request(user), None))

    def test_manager_denied(self):
        from authentication.permissions import IsTenantAdmin
        tenant = make_tenant("TA", "ta2")
        user = make_user(Role.MANAGER, tenant=tenant)
        self.assertFalse(IsTenantAdmin().has_permission(make_request(user), None))

    def test_driver_denied(self):
        from authentication.permissions import IsTenantAdmin
        tenant = make_tenant("TA", "ta3")
        user = make_user(Role.DRIVER, tenant=tenant)
        self.assertFalse(IsTenantAdmin().has_permission(make_request(user), None))


# ---------------------------------------------------------------------------
# IsManagerOrTenantAdmin
# ---------------------------------------------------------------------------

class TestIsManagerOrTenantAdmin(TestCase):
    def test_tenant_admin_allowed(self):
        from authentication.permissions import IsManagerOrTenantAdmin
        tenant = make_tenant("M", "mta1")
        user = make_user(Role.TENANT_ADMIN, tenant=tenant)
        self.assertTrue(IsManagerOrTenantAdmin().has_permission(make_request(user), None))

    def test_manager_allowed(self):
        from authentication.permissions import IsManagerOrTenantAdmin
        tenant = make_tenant("M", "mta2")
        user = make_user(Role.MANAGER, tenant=tenant)
        self.assertTrue(IsManagerOrTenantAdmin().has_permission(make_request(user), None))

    def test_superadmin_allowed(self):
        from authentication.permissions import IsManagerOrTenantAdmin
        user = make_user(Role.SUPERADMIN)
        self.assertTrue(IsManagerOrTenantAdmin().has_permission(make_request(user), None))

    def test_employee_denied(self):
        from authentication.permissions import IsManagerOrTenantAdmin
        tenant = make_tenant("M", "mta3")
        user = make_user(Role.EMPLOYEE, tenant=tenant)
        self.assertFalse(IsManagerOrTenantAdmin().has_permission(make_request(user), None))

    def test_driver_denied(self):
        from authentication.permissions import IsManagerOrTenantAdmin
        tenant = make_tenant("M", "mta4")
        user = make_user(Role.DRIVER, tenant=tenant)
        self.assertFalse(IsManagerOrTenantAdmin().has_permission(make_request(user), None))


# ---------------------------------------------------------------------------
# IsTenantMember
# ---------------------------------------------------------------------------

class TestIsTenantMember(TestCase):
    def test_any_tenant_role_allowed(self):
        from authentication.permissions import IsTenantMember
        tenant = make_tenant("TM", "tm1")
        for i, role in enumerate([Role.TENANT_ADMIN, Role.MANAGER, Role.EMPLOYEE, Role.DRIVER]):
            user = make_user(role, tenant=tenant, email_suffix=str(i))
            self.assertTrue(IsTenantMember().has_permission(make_request(user), None))

    def test_user_without_tenant_denied(self):
        from authentication.permissions import IsTenantMember
        user = make_user(Role.SUPERADMIN)  # SUPERADMIN has no tenant
        self.assertFalse(IsTenantMember().has_permission(make_request(user), None))


# ---------------------------------------------------------------------------
# IsSameTenant
# ---------------------------------------------------------------------------

class TestIsSameTenant(TestCase):
    def test_same_tenant_object_allowed(self):
        from tenants.permissions import IsSameTenant
        tenant = make_tenant("ST", "st1")
        user = make_user(Role.MANAGER, tenant=tenant)
        obj = type("Obj", (), {"tenant": tenant, "tenant_id": tenant.pk})()
        self.assertTrue(IsSameTenant().has_object_permission(make_request(user), None, obj))

    def test_different_tenant_object_denied(self):
        from tenants.permissions import IsSameTenant
        tenant_a = make_tenant("STA", "sta1")
        tenant_b = make_tenant("STB", "stb1")
        user = make_user(Role.MANAGER, tenant=tenant_a)
        obj = type("Obj", (), {"tenant": tenant_b, "tenant_id": tenant_b.pk})()
        self.assertFalse(IsSameTenant().has_object_permission(make_request(user), None, obj))

    def test_superadmin_can_access_any_tenant_object(self):
        from tenants.permissions import IsSameTenant
        tenant = make_tenant("STC", "stc1")
        user = make_user(Role.SUPERADMIN)
        obj = type("Obj", (), {"tenant": tenant, "tenant_id": tenant.pk})()
        self.assertTrue(IsSameTenant().has_object_permission(make_request(user), None, obj))
