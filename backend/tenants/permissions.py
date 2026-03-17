"""
Tenant-level DRF permission: object must belong to the requesting user's tenant.
"""

from rest_framework.permissions import BasePermission

from authentication.models import Role


class IsSameTenant(BasePermission):
    """
    Object-level permission.
    Grants access when the object's `tenant` FK matches the user's `tenant`,
    or when the user is a Superadmin (cross-tenant access).
    """

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # Superadmin can access any tenant's data
        if user.role == Role.SUPERADMIN:
            return True
        return obj.tenant_id == user.tenant_id
