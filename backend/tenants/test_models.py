"""
Test-only concrete subclass of TenantAwareModel.
Used in unit tests to exercise TenantAwareModel behaviour
without coupling tests to real domain models.

This module is intentionally NOT included in migrations —
pytest-django creates it on the fly with --create-db.
"""

from django.db import models

from tenants.models import TenantAwareModel


class SampleTenantModel(TenantAwareModel):
    label = models.CharField(max_length=100)

    class Meta:
        app_label = "tenants"
