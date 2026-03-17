"""Customer model - inherits TenantAwareModel (which provides soft-delete)."""

from __future__ import annotations

from typing import ClassVar

from django.db import models

from tenants.models import TenantAwareModel


class CustomerType(models.TextChoices):
    INDIVIDUAL = "individual", "Individual"
    BUSINESS = "business", "Business"


class Customer(TenantAwareModel):
    """A customer (individual or business) belonging to a tenant."""

    customer_type = models.CharField(max_length=20, choices=CustomerType.choices)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "customers_customer"
        ordering: ClassVar[list[str]] = ["-created_at"]
        constraints: ClassVar[list] = [
            models.UniqueConstraint(
                fields=["tenant", "email"],
                condition=models.Q(deleted_at__isnull=True) & ~models.Q(email=""),
                name="unique_customer_email_per_tenant",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.customer_type})"
