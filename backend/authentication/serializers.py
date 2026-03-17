"""
Authentication serializers for register, login, and profile endpoints.
"""

from __future__ import annotations

from typing import ClassVar

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils.text import slugify
from rest_framework import serializers

from authentication.models import User
from tenants.models import Tenant

# ---------------------------------------------------------------------------
# Tenant serializer (nested response)
# ---------------------------------------------------------------------------

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields: ClassVar[list[str]] = ["id", "name", "subdomain", "email", "currency", "timezone", "is_active"]
        read_only_fields: ClassVar[list[str]] = fields


# ---------------------------------------------------------------------------
# User profile serializer
# ---------------------------------------------------------------------------

class UserProfileSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)

    class Meta:
        model = User
        fields: ClassVar[list[str]] = [
            "id", "email", "first_name", "last_name", "phone",
            "role", "tenant", "date_joined",
        ]
        read_only_fields: ClassVar[list[str]] = ["id", "email", "role", "tenant", "date_joined"]


# ---------------------------------------------------------------------------
# Register serializer
# ---------------------------------------------------------------------------

class RegisterSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150, default="")
    last_name = serializers.CharField(max_length=150, default="")

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value.lower()

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create_subdomain(self, company_name: str) -> str:
        base = slugify(company_name)
        subdomain = base
        counter = 1
        while Tenant.objects.filter(subdomain=subdomain).exists():
            subdomain = f"{base}-{counter}"
            counter += 1
        return subdomain


# ---------------------------------------------------------------------------
# Login serializer
# ---------------------------------------------------------------------------

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["email"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid email or password.", code="authorization")
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.", code="authorization")
        attrs["user"] = user
        return attrs


# ---------------------------------------------------------------------------
# Change password serializer
# ---------------------------------------------------------------------------

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value: str) -> str:
        validate_password(value)
        return value
