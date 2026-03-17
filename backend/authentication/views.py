"""
Authentication views: register, login, logout, me, change-password.
All using httpOnly cookie-based token authentication.
"""

from __future__ import annotations

from typing import ClassVar

from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.models import Role, User
from authentication.serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)
from tenants.models import Tenant

# ---------------------------------------------------------------------------
# Cookie helpers
# ---------------------------------------------------------------------------

def _set_auth_cookie(response: Response, token: str) -> None:
    """Attach the auth token as an httpOnly cookie to *response*."""
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        max_age=settings.AUTH_COOKIE_MAX_AGE,
        secure=settings.AUTH_COOKIE_SECURE,
        httponly=settings.AUTH_COOKIE_HTTPONLY,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )


def _clear_auth_cookie(response: Response) -> None:
    """Clear the auth cookie on *response*."""
    response.delete_cookie(settings.AUTH_COOKIE_NAME)


# ---------------------------------------------------------------------------
# Register  (#23)
# ---------------------------------------------------------------------------

class RegisterView(APIView):
    permission_classes: ClassVar[list] = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        subdomain = serializer.create_subdomain(data["company_name"])

        with transaction.atomic():
            tenant = Tenant.objects.create(
                name=data["company_name"],
                subdomain=subdomain,
                email=data["email"],
            )
            user = User.objects.create_user(
                email=data["email"],
                username=data["email"],
                password=data["password"],
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name", ""),
                role=Role.TENANT_ADMIN,
                tenant=tenant,
            )

        token, _ = Token.objects.get_or_create(user=user)
        profile = UserProfileSerializer(user).data

        response = Response(
            {"user": profile, "tenant": profile["tenant"]},
            status=status.HTTP_201_CREATED,
        )
        _set_auth_cookie(response, token.key)
        return response


# ---------------------------------------------------------------------------
# Login  (#24)
# ---------------------------------------------------------------------------

class LoginView(APIView):
    permission_classes: ClassVar[list] = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        user = serializer.validated_data["user"]

        token, _ = Token.objects.get_or_create(user=user)
        profile = UserProfileSerializer(user).data

        response = Response(
            {"user": profile, "tenant": profile["tenant"]},
            status=status.HTTP_200_OK,
        )
        _set_auth_cookie(response, token.key)
        return response


# ---------------------------------------------------------------------------
# Logout  (#25)
# ---------------------------------------------------------------------------

class LogoutView(APIView):
    permission_classes: ClassVar[list] = [IsAuthenticated]

    def post(self, request):
        # Delete the server-side token
        try:
            request.user.auth_token.delete()
        except Token.DoesNotExist:
            pass

        response = Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)
        _clear_auth_cookie(response)
        return response


# ---------------------------------------------------------------------------
# Me (profile)  (#26)
# ---------------------------------------------------------------------------

class MeView(APIView):
    permission_classes: ClassVar[list] = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Change password  (#27)
# ---------------------------------------------------------------------------

class ChangePasswordView(APIView):
    permission_classes: ClassVar[list] = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"old_password": "Incorrect password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save()

        # Re-issue token after password change
        try:
            user.auth_token.delete()
        except Token.DoesNotExist:
            pass
        token = Token.objects.create(user=user)

        response = Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)
        _set_auth_cookie(response, token.key)
        return response
