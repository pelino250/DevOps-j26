import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useVehicleStore } from "../store/vehicleStore";
import type { VehicleStatus } from "../types";

const NEXT_STATUS_OPTIONS: Record<VehicleStatus, VehicleStatus[]> = {
  active: ["maintenance", "out_of_service", "sold"],
  maintenance: ["active", "out_of_service", "sold"],
  out_of_service: ["active", "maintenance", "sold"],
  sold: [],
};

const statusColor: Record<VehicleStatus, string> = {
  active: "#16a34a",
  maintenance: "#ca8a04",
  out_of_service: "#dc2626",
  sold: "#6b7280",
};

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentVehicle: vehicle,
    loading,
    error,
    fetchVehicle,
    changeStatus,
    assignDriver,
    unassignDriver,
    updateMileage,
    deleteVehicle,
    clearError,
  } = useVehicleStore();

  const [driverId, setDriverId] = useState("");
  const [mileage, setMileage] = useState("");
  const [tab, setTab] = useState<"overview" | "documents" | "history">("overview");

  useEffect(() => {
    if (id) fetchVehicle(Number(id));
  }, [id, fetchVehicle]);

  if (loading && !vehicle) return <p>Loading…</p>;
  if (!vehicle) return <p>Vehicle not found.</p>;

  const handleStatusChange = async (status: VehicleStatus) => {
    await changeStatus(vehicle.id, status);
    fetchVehicle(vehicle.id);
  };

  const handleAssignDriver = async () => {
    if (!driverId) return;
    await assignDriver(vehicle.id, Number(driverId));
    setDriverId("");
    fetchVehicle(vehicle.id);
  };

  const handleUnassignDriver = async () => {
    await unassignDriver(vehicle.id);
    fetchVehicle(vehicle.id);
  };

  const handleMileage = async () => {
    if (!mileage) return;
    await updateMileage(vehicle.id, Number(mileage));
    setMileage("");
    fetchVehicle(vehicle.id);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this vehicle?")) return;
    await deleteVehicle(vehicle.id);
    navigate("/vehicles");
  };

  const nextStatuses = NEXT_STATUS_OPTIONS[vehicle.status];

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link to={`/vehicles/${vehicle.id}/edit`}><button>Edit</button></Link>
          <button onClick={handleDelete}>Delete</button>
          <Link to="/vehicles"><button>Back</button></Link>
        </div>
      </div>

      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={clearError} type="button">&times;</button>
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", margin: "1rem 0" }}>
        {(["overview", "documents", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ fontWeight: tab === t ? "bold" : "normal" }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <dl>
            <dt>License Plate</dt>
            <dd>{vehicle.license_plate}</dd>
            <dt>VIN</dt>
            <dd>{vehicle.vin || "—"}</dd>
            <dt>Fuel Type</dt>
            <dd>{vehicle.fuel_type}</dd>
            <dt>Status</dt>
            <dd>
              <span
                style={{
                  color: "#fff",
                  background: statusColor[vehicle.status],
                  padding: "0.15rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                {vehicle.status.replace("_", " ")}
              </span>
            </dd>
            <dt>Mileage</dt>
            <dd>{vehicle.current_mileage.toLocaleString()} km</dd>
            {vehicle.baseline_fuel_consumption && (
              <>
                <dt>Fuel Consumption</dt>
                <dd>{vehicle.baseline_fuel_consumption} L/100km</dd>
              </>
            )}
            <dt>Assigned Driver</dt>
            <dd>{vehicle.assigned_driver_email ?? "None"}</dd>
          </dl>

          <h3 style={{ marginTop: "1.5rem" }}>Actions</h3>

          {nextStatuses.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <strong>Change Status:</strong>{" "}
              {nextStatuses.map((s) => (
                <button key={s} onClick={() => handleStatusChange(s)} style={{ marginLeft: "0.5rem" }}>
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: "0.5rem" }}>
            <strong>Driver:</strong>{" "}
            {vehicle.assigned_driver ? (
              <button onClick={handleUnassignDriver}>Unassign Driver</button>
            ) : (
              <>
                <input
                  type="number"
                  placeholder="Driver ID"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  style={{ width: "100px", marginLeft: "0.5rem" }}
                />
                <button onClick={handleAssignDriver} style={{ marginLeft: "0.5rem" }}>
                  Assign
                </button>
              </>
            )}
          </div>

          <div style={{ marginTop: "0.5rem" }}>
            <strong>Update Mileage:</strong>
            <input
              type="number"
              placeholder="New mileage"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              style={{ width: "120px", marginLeft: "0.5rem" }}
            />
            <button onClick={handleMileage} style={{ marginLeft: "0.5rem" }}>
              Update
            </button>
          </div>
        </div>
      )}

      {tab === "documents" && (
        <div>
          {vehicle.documents.length === 0 ? (
            <p>No documents attached.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Expiry</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicle.documents.map((doc) => (
                  <tr key={doc.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.5rem" }}>
                      <a href={doc.file_url} target="_blank" rel="noreferrer">{doc.title}</a>
                    </td>
                    <td style={{ padding: "0.5rem" }}>{doc.document_type}</td>
                    <td style={{ padding: "0.5rem" }}>{doc.expiry_date ?? "—"}</td>
                    <td style={{ padding: "0.5rem" }}>
                      {doc.is_overdue ? (
                        <span style={{ color: "#dc2626", fontWeight: "bold" }}>Overdue</span>
                      ) : (
                        "Valid"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "history" && (
        <div>
          {vehicle.status_history.length === 0 ? (
            <p>No status changes recorded.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>From</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>To</th>
                </tr>
              </thead>
              <tbody>
                {vehicle.status_history.map((h) => (
                  <tr key={h.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.5rem" }}>{new Date(h.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "0.5rem" }}>{h.old_status.replace("_", " ")}</td>
                    <td style={{ padding: "0.5rem" }}>{h.new_status.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
