"""Vehicle model - inherits TenantAwareModel (which provides soft-delete)."""

from __future__ import annotations

from typing import ClassVar

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from tenants.models import TenantAwareModel


class FuelType(models.TextChoices):
    DIESEL = "diesel", "Diesel"
    PETROL = "petrol", "Petrol"
    ELECTRIC = "electric", "Electric"
    HYBRID = "hybrid", "Hybrid"


class VehicleStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    MAINTENANCE = "maintenance", "Maintenance"
    OUT_OF_SERVICE = "out_of_service", "Out of Service"
    SOLD = "sold", "Sold"


# Allowed status transitions - Sold is terminal.
VALID_STATUS_TRANSITIONS: dict[str, list[str]] = {
    VehicleStatus.ACTIVE: [VehicleStatus.MAINTENANCE, VehicleStatus.OUT_OF_SERVICE, VehicleStatus.SOLD],
    VehicleStatus.MAINTENANCE: [VehicleStatus.ACTIVE, VehicleStatus.OUT_OF_SERVICE, VehicleStatus.SOLD],
    VehicleStatus.OUT_OF_SERVICE: [VehicleStatus.ACTIVE, VehicleStatus.MAINTENANCE, VehicleStatus.SOLD],
    VehicleStatus.SOLD: [],  # terminal
}


class Vehicle(TenantAwareModel):
    """A vehicle belonging to a tenant's fleet."""

    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    license_plate = models.CharField(max_length=30)
    vin = models.CharField(max_length=50, blank=True)
    fuel_type = models.CharField(max_length=20, choices=FuelType.choices)
    status = models.CharField(max_length=20, choices=VehicleStatus.choices, default=VehicleStatus.ACTIVE)
    current_mileage = models.PositiveIntegerField(default=0)
    baseline_fuel_consumption = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    assigned_driver = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_vehicle",
    )

    class Meta:
        db_table = "fleet_vehicle"
        constraints: ClassVar[list] = [
            models.UniqueConstraint(
                fields=["tenant", "license_plate"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_license_plate_per_tenant",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.make} {self.model} ({self.license_plate})"

    @property
    def documents_active(self):
        """Return non-deleted documents for this vehicle."""
        return self.documents.filter(deleted_at__isnull=True)

    def transition_status(self, new_status: str) -> None:
        """Transition to *new_status* if allowed, else raise ValidationError."""
        allowed = VALID_STATUS_TRANSITIONS.get(self.status, [])
        if new_status not in allowed:
            msg = f"Cannot transition from '{self.status}' to '{new_status}'."
            raise ValidationError(msg)
        old_status = self.status
        self.status = new_status
        self.save(update_fields=["status"])
        # Record in history
        StatusHistory.objects.create(vehicle=self, old_status=old_status, new_status=new_status, tenant=self.tenant)


class StatusHistory(TenantAwareModel):
    """Tracks every status change for a vehicle."""

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="status_history")
    old_status = models.CharField(max_length=20, choices=VehicleStatus.choices)
    new_status = models.CharField(max_length=20, choices=VehicleStatus.choices)

    class Meta:
        db_table = "fleet_status_history"
        ordering: ClassVar[list[str]] = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.vehicle} : {self.old_status} → {self.new_status}"


class VehicleDocument(TenantAwareModel):
    """Documents attached to a vehicle (registration, insurance, etc.)."""

    class DocumentType(models.TextChoices):
        REGISTRATION = "registration", "Registration"
        INSURANCE = "insurance", "Insurance"
        INSPECTION = "inspection", "Inspection"
        OTHER = "other", "Other"

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    title = models.CharField(max_length=255)
    file_url = models.URLField(blank=True)
    expiry_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "fleet_vehicle_document"
        ordering: ClassVar[list[str]] = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.document_type})"

    @property
    def is_overdue(self) -> bool:
        """True if the document has an expiry date in the past."""
        if self.expiry_date is None:
            return False
        from django.utils import timezone

        return self.expiry_date < timezone.now().date()


class DriverProfile(TenantAwareModel):
    """Extended profile for users with driver role."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="driver_profile",
    )
    license_number = models.CharField(max_length=50)
    license_expiry = models.DateField()
    license_class = models.CharField(max_length=20)
    date_of_birth = models.DateField()
    emergency_contact_name = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(max_length=20)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "fleet_driver_profile"

    def __str__(self) -> str:
        return f"{self.user.get_full_name()} ({self.license_number})"


class TripStatus(models.TextChoices):
    IN_PROGRESS = "in_progress", "In Progress"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class Trip(TenantAwareModel):
    """Trip/journey record for a vehicle."""

    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name="trips")
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="trips",
    )
    status = models.CharField(
        max_length=20,
        choices=TripStatus.choices,
        default=TripStatus.IN_PROGRESS,
    )

    # Trip details
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    start_mileage = models.PositiveIntegerField()
    end_mileage = models.PositiveIntegerField(null=True, blank=True)

    # Optional details
    start_location = models.CharField(max_length=255, blank=True)
    end_location = models.CharField(max_length=255, blank=True)
    purpose = models.CharField(max_length=255, blank=True)
    fuel_consumed = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Fuel consumed in liters",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "fleet_trip"
        ordering: ClassVar[list[str]] = ["-start_time"]

    def __str__(self) -> str:
        vehicle_str = f"{self.vehicle.make} {self.vehicle.model}"
        driver_str = self.driver.get_full_name() or self.driver.email
        return f"{vehicle_str} - {driver_str} ({self.start_time.date()})"

    @property
    def distance_km(self) -> int | None:
        """Calculate distance traveled in kilometers."""
        if self.end_mileage is not None:
            return self.end_mileage - self.start_mileage
        return None

    @property
    def duration_hours(self) -> float | None:
        """Calculate trip duration in hours."""
        if self.end_time is not None:
            delta = self.end_time - self.start_time
            return delta.total_seconds() / 3600
        return None

    def clean(self) -> None:
        """Validate trip data."""
        super().clean()

        # End mileage must be greater than start mileage
        if self.end_mileage is not None and self.end_mileage <= self.start_mileage:
            msg = "End mileage must be greater than start mileage."
            raise ValidationError({"end_mileage": msg})

        # End time must be after start time
        if self.end_time is not None and self.end_time <= self.start_time:
            msg = "End time must be after start time."
            raise ValidationError({"end_time": msg})
