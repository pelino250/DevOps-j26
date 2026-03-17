"""Customer app views — CRUD, search, summary, soft-delete/restore."""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from authentication.permissions import IsTenantMember
from customers.models import Customer
from customers.serializers import CustomerSerializer, CustomerSummarySerializer


class CustomerViewSet(viewsets.ModelViewSet):
    """
    CRUD for customers, scoped to the requesting user's tenant.
    Includes search, soft-delete, restore, and a summary endpoint.
    """

    serializer_class = CustomerSerializer
    permission_classes = [IsTenantMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["customer_type"]
    search_fields = ["name", "email", "phone", "contact_person"]
    ordering_fields = ["name", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Customer.objects.active().for_tenant(self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    def perform_destroy(self, instance):
        instance.soft_delete()

    # POST /customers/{id}/restore/
    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        customer = Customer.objects.filter(
            pk=pk, tenant=request.user.tenant, deleted_at__isnull=False,
        ).first()
        if not customer:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        customer.restore()
        return Response(CustomerSerializer(customer).data)

    # GET /customers/summary/ — lightweight list for dropdowns (no pagination)
    @action(detail=False, methods=["get"])
    def summary(self, request):
        qs = self.get_queryset().order_by("name")
        serializer = CustomerSummarySerializer(qs, many=True)
        return Response(serializer.data)
