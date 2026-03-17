"""
Tests for Tenant, TenantAwareModel and SoftDeleteModel (#22).

Uses Django's isolate_apps (requires TestCase) to define a concrete
TenantAwareModel subclass inline so no extra migration is required.
"""

import pytest
from django.db import connection, models
from django.test import TransactionTestCase
from django.test.utils import isolate_apps

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_table(model_cls):
    connection.disable_constraint_checking()
    with connection.schema_editor() as editor:
        editor.create_model(model_cls)
    connection.enable_constraint_checking()


def _drop_table(model_cls):
    connection.disable_constraint_checking()
    with connection.schema_editor() as editor:
        editor.delete_model(model_cls)
    connection.enable_constraint_checking()


# ---------------------------------------------------------------------------
# Tenant model tests (plain pytest — no custom model needed)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTenantModel:
    def test_tenant_can_be_created(self):
        from tenants.models import Tenant

        tenant = Tenant.objects.create(
            name="Acme Fleet",
            subdomain="acme",
            email="admin@acme.com",
        )
        assert tenant.pk is not None
        assert tenant.name == "Acme Fleet"
        assert tenant.subdomain == "acme"

    def test_tenant_subdomain_is_unique(self):
        from django.db import IntegrityError

        from tenants.models import Tenant

        Tenant.objects.create(name="Alpha", subdomain="alpha", email="a@a.com")
        with pytest.raises(IntegrityError):
            Tenant.objects.create(name="Alpha2", subdomain="alpha", email="b@b.com")

    def test_tenant_str(self):
        from tenants.models import Tenant

        tenant = Tenant.objects.create(name="Beta Corp", subdomain="beta", email="b@beta.com")
        assert str(tenant) == "Beta Corp"

    def test_subdomain_auto_generated_from_name(self):
        from tenants.models import Tenant

        tenant = Tenant(name="My Company", email="x@x.com")
        tenant.save()
        assert tenant.subdomain == "my-company"


# ---------------------------------------------------------------------------
# TenantAwareModel tests — require isolate_apps → must use TestCase
# ---------------------------------------------------------------------------

@isolate_apps("tenants")
class TestTenantAwareModel(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        from tenants.models import TenantAwareModel

        class Sample(TenantAwareModel):
            label = models.CharField(max_length=100)

            class Meta:
                app_label = "tenants"

        cls.Sample = Sample
        _create_table(Sample)

    @classmethod
    def tearDownClass(cls):
        _drop_table(cls.Sample)
        super().tearDownClass()

    def test_for_tenant_only_returns_own_tenant_data(self):
        from tenants.models import Tenant

        tenant_a = Tenant.objects.create(name="A Co", subdomain="aco", email="a@a.com")
        tenant_b = Tenant.objects.create(name="B Co", subdomain="bco", email="b@b.com")

        self.Sample.objects.create(tenant=tenant_a, label="for-a")
        self.Sample.objects.create(tenant=tenant_b, label="for-b")

        results_a = self.Sample.objects.for_tenant(tenant_a)
        self.assertEqual(results_a.count(), 1)
        self.assertEqual(results_a.first().label, "for-a")

        results_b = self.Sample.objects.for_tenant(tenant_b)
        self.assertEqual(results_b.count(), 1)
        self.assertEqual(results_b.first().label, "for-b")

    def test_default_manager_returns_all(self):
        from tenants.models import Tenant

        tenant_a = Tenant.objects.create(name="GA", subdomain="ga", email="ga@a.com")
        tenant_b = Tenant.objects.create(name="GB", subdomain="gb", email="gb@b.com")

        self.Sample.objects.create(tenant=tenant_a, label="a1")
        self.Sample.objects.create(tenant=tenant_b, label="b1")

        self.assertEqual(self.Sample.objects.count(), 2)


# ---------------------------------------------------------------------------
# SoftDelete tests — also require isolate_apps
# ---------------------------------------------------------------------------

@isolate_apps("tenants")
class TestSoftDeleteModel(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        from tenants.models import TenantAwareModel

        class Sample(TenantAwareModel):
            label = models.CharField(max_length=100)

            class Meta:
                app_label = "tenants"

        cls.Sample = Sample
        _create_table(Sample)

    @classmethod
    def tearDownClass(cls):
        _drop_table(cls.Sample)
        super().tearDownClass()

    def _make_tenant(self, **kwargs):
        from tenants.models import Tenant
        return Tenant.objects.create(**kwargs)

    def test_soft_delete_sets_deleted_at(self):
        tenant = self._make_tenant(name="T1", subdomain="t1sd", email="t1@t.com")
        obj = self.Sample.objects.create(tenant=tenant, label="item")

        obj.soft_delete()
        obj.refresh_from_db()

        self.assertIsNotNone(obj.deleted_at)
        self.assertTrue(obj.is_deleted)

    def test_soft_deleted_excluded_from_active_queryset(self):
        tenant = self._make_tenant(name="T2", subdomain="t2sd", email="t2@t.com")
        self.Sample.objects.create(tenant=tenant, label="active")
        deleted = self.Sample.objects.create(tenant=tenant, label="deleted")
        deleted.soft_delete()

        active = self.Sample.objects.active()
        self.assertEqual(active.count(), 1)
        self.assertEqual(active.first().label, "active")

    def test_restore_clears_deleted_at(self):
        tenant = self._make_tenant(name="T3", subdomain="t3sd", email="t3@t.com")
        obj = self.Sample.objects.create(tenant=tenant, label="gone")
        obj.soft_delete()
        obj.restore()
        obj.refresh_from_db()

        self.assertIsNone(obj.deleted_at)
        self.assertFalse(obj.is_deleted)

    def test_hard_delete_removes_record(self):
        tenant = self._make_tenant(name="T4", subdomain="t4sd", email="t4@t.com")
        obj = self.Sample.objects.create(tenant=tenant, label="perm")
        pk = obj.pk
        obj.hard_delete()

        self.assertFalse(self.Sample.objects.filter(pk=pk).exists())

