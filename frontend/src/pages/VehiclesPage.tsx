import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useVehicleStore } from "../store/vehicleStore";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table";
import { Card } from "../components/ui/card";
import type { VehicleStatus } from "../types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "out_of_service", label: "Out of Service" },
  { value: "sold", label: "Sold" },
];

const statusVariant: Record<VehicleStatus, "success" | "warning" | "danger" | "secondary"> = {
  active: "success",
  maintenance: "warning",
  out_of_service: "danger",
  sold: "secondary",
};

export default function VehiclesPage() {
  const { vehicles, totalCount, loading, error, fetchVehicles, deleteVehicle, clearError } =
    useVehicleStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchVehicles({ search: search || undefined, status: status || undefined, page });
  }, [fetchVehicles, search, status, page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this vehicle?")) return;
    await deleteVehicle(id);
    fetchVehicles({ search: search || undefined, status: status || undefined, page });
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description={`Manage your fleet of ${totalCount} vehicles`}
        actions={
          <Button onClick={() => navigate("/vehicles/new")}>
            Add Vehicle
          </Button>
        }
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
              placeholder="Search make, model, plate..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1"
            />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </Card>

        {loading && <p className="text-text-secondary">Loading...</p>}

        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Link to={`/vehicles/${v.id}`} className="text-primary hover:underline font-medium">
                      {v.year} {v.make} {v.model}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{v.license_plate}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[v.status]}>
                      {v.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{v.current_mileage.toLocaleString()} km</TableCell>
                  <TableCell className="text-text-secondary">{v.assigned_driver_email ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/vehicles/${v.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(v.id)}
                        className="text-danger hover:bg-danger/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && vehicles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                    No vehicles found.
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
