import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useVehicleStore } from "../store/vehicleStore";
import type { FuelType, VehicleCreatePayload } from "../types";

const FUEL_OPTIONS: { value: FuelType; label: string }[] = [
  { value: "diesel", label: "Diesel" },
  { value: "petrol", label: "Petrol" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
];

export default function VehicleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { currentVehicle, loading, error, fetchVehicle, createVehicle, updateVehicle, clearError } =
    useVehicleStore();

  const [form, setForm] = useState<VehicleCreatePayload>({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    license_plate: "",
    vin: "",
    fuel_type: "diesel",
    current_mileage: 0,
    baseline_fuel_consumption: undefined,
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchVehicle(Number(id));
    }
  }, [isEdit, id, fetchVehicle]);

  useEffect(() => {
    if (isEdit && currentVehicle) {
      setForm({
        make: currentVehicle.make,
        model: currentVehicle.model,
        year: currentVehicle.year,
        license_plate: currentVehicle.license_plate,
        vin: currentVehicle.vin || "",
        fuel_type: currentVehicle.fuel_type,
        current_mileage: currentVehicle.current_mileage,
        baseline_fuel_consumption: currentVehicle.baseline_fuel_consumption ?? undefined,
      });
    }
  }, [isEdit, currentVehicle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["year", "current_mileage", "baseline_fuel_consumption"].includes(name)
        ? value === "" ? undefined : Number(value)
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      if (isEdit && id) {
        await updateVehicle(Number(id), form);
      } else {
        await createVehicle(form);
      }
      navigate("/vehicles");
    } catch {
      // error set in store
    }
  };

  return (
    <div className="page">
      <h1>{isEdit ? "Edit Vehicle" : "Add Vehicle"}</h1>

      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={clearError} type="button">&times;</button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: "500px" }}>
        <label>
          Make
          <input name="make" value={form.make} onChange={handleChange} required />
        </label>
        <label>
          Model
          <input name="model" value={form.model} onChange={handleChange} required />
        </label>
        <label>
          Year
          <input name="year" type="number" value={form.year} onChange={handleChange} required min={1900} max={2100} />
        </label>
        <label>
          License Plate
          <input name="license_plate" value={form.license_plate} onChange={handleChange} required />
        </label>
        <label>
          VIN
          <input name="vin" value={form.vin ?? ""} onChange={handleChange} />
        </label>
        <label>
          Fuel Type
          <select name="fuel_type" value={form.fuel_type} onChange={handleChange}>
            {FUEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label>
          Current Mileage (km)
          <input name="current_mileage" type="number" value={form.current_mileage ?? 0} onChange={handleChange} min={0} />
        </label>
        <label>
          Fuel Consumption (L/100km)
          <input
            name="baseline_fuel_consumption"
            type="number"
            step="0.1"
            value={form.baseline_fuel_consumption ?? ""}
            onChange={handleChange}
          />
        </label>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button type="submit" disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Update" : "Create"}
          </button>
          <button type="button" onClick={() => navigate("/vehicles")}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
