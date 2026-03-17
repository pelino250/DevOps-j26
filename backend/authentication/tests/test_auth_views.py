"""
Tests for authentication endpoints (#23, #24, #25, #26, #27).

RED step: written before any views/serializers exist.
"""

from django.conf import settings
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


def make_client():
    return APIClient()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def register(client, **overrides):
    payload = {
        "company_name": "Acme Fleet",
        "email": "admin@acme.com",
        "password": "StrongPass123!",
        "first_name": "Alice",
        "last_name": "Smith",
    }
    payload.update(overrides)
    return client.post("/api/v1/auth/register/", payload, format="json")


def login(client, email="admin@acme.com", password="StrongPass123!"):
    return client.post(
        "/api/v1/auth/login/",
        {"email": email, "password": password},
        format="json",
    )


# ---------------------------------------------------------------------------
# #23 — Register
# ---------------------------------------------------------------------------

class TestRegister(TestCase):
    def setUp(self):
        self.client = make_client()

    def test_register_creates_tenant_and_user(self):
        from authentication.models import Role, User
        from tenants.models import Tenant

        resp = register(self.client)

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        # A tenant was created
        self.assertEqual(Tenant.objects.count(), 1)
        tenant = Tenant.objects.first()
        self.assertEqual(tenant.name, "Acme Fleet")
        # A user was created as tenant admin
        user = User.objects.get(email="admin@acme.com")
        self.assertEqual(user.role, Role.TENANT_ADMIN)
        self.assertEqual(user.tenant, tenant)

    def test_register_returns_user_and_tenant_info(self):
        resp = register(self.client)

        self.assertIn("user", resp.data)
        self.assertIn("tenant", resp.data)
        self.assertEqual(resp.data["user"]["email"], "admin@acme.com")

    def test_register_sets_auth_cookie(self):
        resp = register(self.client)

        self.assertIn(settings.AUTH_COOKIE_NAME, resp.cookies)
        cookie = resp.cookies[settings.AUTH_COOKIE_NAME]
        self.assertTrue(cookie["httponly"])

    def test_register_subdomain_auto_generated(self):
        from tenants.models import Tenant

        register(self.client, company_name="My Company")
        tenant = Tenant.objects.get(name="My Company")
        self.assertEqual(tenant.subdomain, "my-company")

    def test_register_duplicate_email_returns_400(self):
        register(self.client)
        resp = register(self.client)  # same email again

        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_tenant_and_user_created_atomically(self):
        """If user creation fails, no orphan tenant should remain."""
        from tenants.models import Tenant

        # Missing required field → should fail atomically
        resp = self.client.post(
            "/api/v1/auth/register/",
            {"company_name": "X", "email": "bad", "password": ""},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Tenant.objects.count(), 0)


# ---------------------------------------------------------------------------
# #24 — Login
# ---------------------------------------------------------------------------

class TestLogin(TestCase):
    def setUp(self):
        self.client = make_client()
        register(self.client)
        # Clear cookie so we can test login fresh
        self.client.cookies.clear()

    def test_login_returns_200_with_valid_credentials(self):
        resp = login(self.client)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_login_response_contains_user_and_tenant(self):
        resp = login(self.client)
        self.assertIn("user", resp.data)
        self.assertIn("tenant", resp.data)

    def test_login_sets_httponly_cookie(self):
        resp = login(self.client)
        self.assertIn(settings.AUTH_COOKIE_NAME, resp.cookies)
        self.assertTrue(resp.cookies[settings.AUTH_COOKIE_NAME]["httponly"])

    def test_login_invalid_credentials_returns_401(self):
        resp = login(self.client, password="wrongpass")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user_returns_401(self):
        resp = login(self.client, email="ghost@example.com")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# #25 — Logout
# ---------------------------------------------------------------------------

class TestLogout(TestCase):
    def setUp(self):
        self.client = make_client()
        register(self.client)
        # Cookie is set from register

    def test_logout_returns_200(self):
        resp = self.client.post("/api/v1/auth/logout/", format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_logout_clears_auth_cookie(self):
        resp = self.client.post("/api/v1/auth/logout/", format="json")
        # Cookie should be cleared (max-age=0 or empty value)
        cookie = resp.cookies.get(settings.AUTH_COOKIE_NAME)
        if cookie:
            self.assertIn(cookie.value, ["", None] or cookie["max-age"] == 0)

    def test_logout_invalidates_token(self):
        """After logout, authenticated endpoints should return 401."""
        self.client.post("/api/v1/auth/logout/", format="json")
        resp = self.client.get("/api/v1/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_requires_authentication(self):
        fresh_client = make_client()
        resp = fresh_client.post("/api/v1/auth/logout/", format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# #26 — Profile (me)
# ---------------------------------------------------------------------------

class TestMe(TestCase):
    def setUp(self):
        self.client = make_client()
        register(self.client)

    def test_get_me_returns_user_profile(self):
        resp = self.client.get("/api/v1/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["email"], "admin@acme.com")
        self.assertIn("tenant", resp.data)

    def test_put_me_updates_profile(self):
        resp = self.client.put(
            "/api/v1/auth/me/",
            {"first_name": "Bob", "last_name": "Jones", "phone": "+250788000000"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["first_name"], "Bob")
        self.assertEqual(resp.data["phone"], "+250788000000")

    def test_me_requires_authentication(self):
        fresh_client = make_client()
        resp = fresh_client.get("/api/v1/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_me_partial_update(self):
        resp = self.client.patch(
            "/api/v1/auth/me/",
            {"first_name": "Charlie"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["first_name"], "Charlie")


# ---------------------------------------------------------------------------
# #27 — Password change
# ---------------------------------------------------------------------------

class TestChangePassword(TestCase):
    def setUp(self):
        self.client = make_client()
        register(self.client)

    def test_change_password_succeeds_with_correct_old_password(self):
        resp = self.client.post(
            "/api/v1/auth/change-password/",
            {"old_password": "StrongPass123!", "new_password": "NewStrong456!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_change_password_reissues_cookie(self):
        resp = self.client.post(
            "/api/v1/auth/change-password/",
            {"old_password": "StrongPass123!", "new_password": "NewStrong456!"},
            format="json",
        )
        self.assertIn(settings.AUTH_COOKIE_NAME, resp.cookies)

    def test_change_password_wrong_old_password_returns_400(self):
        resp = self.client.post(
            "/api/v1/auth/change-password/",
            {"old_password": "WrongOld!", "new_password": "NewStrong456!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_requires_authentication(self):
        fresh_client = make_client()
        resp = fresh_client.post(
            "/api/v1/auth/change-password/",
            {"old_password": "StrongPass123!", "new_password": "NewStrong456!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
