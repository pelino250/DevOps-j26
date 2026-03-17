"""
Tenants app models.

Provides:
  - Tenant          : The top-level organisational unit (one per company)
  - TenantAwareModel: Abstract base class that scopes all queries to a tenant
  - SoftDeleteModel : Mixin providing soft-delete / restore / hard-delete
"""

from __future__ import annotations

from django.db import models
from django.utils import timezone
from django.utils.text import slugify

# ---------------------------------------------------------------------------
# Tenant
# ---------------------------------------------------------------------------

class Tenant(models.Model):
    name = models.CharField(max_length=255)
    subdomain = models.SlugField(max_length=100, unique=True)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    logo = models.ImageField(upload_to="tenant_logos/", null=True, blank=True)
    currency = models.CharField(max_length=3, default="RWF")
    timezone = models.CharField(max_length=50, default="Africa/Kigali")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tenants_tenant"

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        if not self.subdomain:
            self.subdomain = slugify(self.name)
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# TenantAware queryset / manager
# ---------------------------------------------------------------------------

class TenantAwareQuerySet(models.QuerySet):
    def for_tenant(self, tenant: Tenant) -> TenantAwareQuerySet:
        """Return only records belonging to *tenant*."""
        return self.filter(tenant=tenant)

    def active(self) -> TenantAwareQuerySet:
        """Exclude soft-deleted records (where deleted_at is set)."""
        return self.filter(deleted_at__isnull=True)


class TenantAwareManager(models.Manager):
    def get_queryset(self) -> TenantAwareQuerySet:
        return TenantAwareQuerySet(self.model, using=self._db)

    def for_tenant(self, tenant: Tenant) -> TenantAwareQuerySet:
        return self.get_queryset().for_tenant(tenant)

    def active(self) -> TenantAwareQuerySet:
        return self.get_queryset().active()


# ---------------------------------------------------------------------------
# TenantAwareModel — abstract base for all tenant-scoped models
# ---------------------------------------------------------------------------

class TenantAwareModel(models.Model):
    """
    Abstract base class.  Every concrete subclass will be automatically
    filtered to the requesting user's tenant via the custom manager.
    """

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="%(app_label)s_%(class)s_set",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = TenantAwareManager()

    class Meta:
        abstract = True

    # ------------------------------------------------------------------
    # Soft-delete helpers
    # ------------------------------------------------------------------

    def soft_delete(self) -> None:
        """Mark record as deleted without removing it from the database."""
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def restore(self) -> None:
        """Undo a soft delete."""
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])

    def hard_delete(self) -> None:
        """Permanently remove the record."""
        super().delete()

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
