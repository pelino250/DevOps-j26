import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerStore } from "../store/customerStore";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../components/ui/table";
import { Card } from "../components/ui/card";
import { User, Building } from "lucide-react";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business" },
];

export default function CustomersPage() {
  const { customers, totalCount, loading, error, fetchCustomers, deleteCustomer, clearError } =
    useCustomerStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCustomers({
      search: search || undefined,
      customer_type: customerType || undefined,
      page,
    });
  }, [fetchCustomers, search, customerType, page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this customer?")) return;
    await deleteCustomer(id);
    fetchCustomers({ search: search || undefined, customer_type: customerType || undefined, page });
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`Manage your ${totalCount} customers`}
        actions={<Button onClick={() => navigate("/customers/new")}>Add Customer</Button>}
      />

      <div className="mt-6">
        {error && (
          <div className="bg-danger/10 border border-danger text-danger rounded-lg p-4 mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-danger hover:text-danger/80">
              &times;
            </button>
          </div>
        )}

        <Card className="mb-6">
          <div className="flex gap-4">
            <Input
              type="search"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="flex-1"
            />
            <select
              value={customerType}
              onChange={(e) => {
                setCustomerType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {loading && <p className="text-text-secondary">Loading...</p>}

        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {c.customer_type === "individual" ? (
                        <User size={16} className="text-text-secondary" />
                      ) : (
                        <Building size={16} className="text-text-secondary" />
                      )}
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.customer_type === "individual" ? "default" : "secondary"}>
                      {c.customer_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">{c.email || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{c.phone || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/customers/${c.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c.id)}
                        className="text-danger hover:bg-danger/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-text-secondary">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-text-secondary">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
