from __future__ import annotations

from typing import ClassVar

from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    SUPERADMIN = "superadmin", "Superadmin"
    TENANT_ADMIN = "tenant_admin", "Tenant Admin"
    MANAGER = "manager", "Manager"
    EMPLOYEE = "employee", "Employee"
    DRIVER = "driver", "Driver"


class User(AbstractUser):
    """Custom user model with role and tenant relationship."""

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    tenant = models.ForeignKey(
        "tenants.Tenant",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="users",
    )
    phone = models.CharField(max_length=20, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = ["username"]

    class Meta:
        db_table = "auth_user"

    def __str__(self) -> str:
        return self.email

    @property
    def is_superadmin(self) -> bool:
        return self.role == Role.SUPERADMIN

    @property
    def is_tenant_admin(self) -> bool:
        return self.role == Role.TENANT_ADMIN

    @property
    def is_manager(self) -> bool:
        return self.role == Role.MANAGER
