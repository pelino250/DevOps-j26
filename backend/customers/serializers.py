"""Serializers for the customers app."""

from rest_framework import serializers

from customers.models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "customer_type",
            "name",
            "email",
            "phone",
            "address",
            "tax_id",
            "contact_person",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_email(self, value):
        """Check for duplicate email within current tenant (excluding soft-deleted)."""
        if not value:
            return value
        request = self.context.get("request")
        if not request:
            return value
        qs = Customer.objects.active().filter(
            tenant=request.user.tenant, email=value,
        )
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A customer with this email already exists.")
        return value


class CustomerSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdowns — id + name only."""

    class Meta:
        model = Customer
        fields = ["id", "name"]
