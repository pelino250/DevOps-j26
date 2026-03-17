/** Shared TypeScript types for the FleeMa frontend. */

export type Role = "superadmin" | "tenant_admin" | "manager" | "employee" | "driver";

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  tenant: Tenant | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name: string;
}

// ---------------------------------------------------------------------------
// Fleet types
// ---------------------------------------------------------------------------

export type FuelType = "diesel" | "petrol" | "electric" | "hybrid";
export type VehicleStatus = "active" | "maintenance" | "out_of_service" | "sold";

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  fuel_type: FuelType;
  status: VehicleStatus;
  current_mileage: number;
  baseline_fuel_consumption: number | null;
  assigned_driver: number | null;
  assigned_driver_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleDetail extends Vehicle {
  documents: VehicleDocument[];
  status_history: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  id: number;
  old_status: VehicleStatus;
  new_status: VehicleStatus;
  created_at: string;
}

export interface VehicleDocument {
  id: number;
  document_type: "registration" | "insurance" | "inspection" | "other";
  title: string;
  file_url: string;
  expiry_date: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreatePayload {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin?: string;
  fuel_type: FuelType;
  current_mileage?: number;
  baseline_fuel_consumption?: number;
}

// ---------------------------------------------------------------------------
// Customer types
// ---------------------------------------------------------------------------

export type CustomerType = "individual" | "business";

export interface Customer {
  id: number;
  customer_type: CustomerType;
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  contact_person: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreatePayload {
  customer_type: CustomerType;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  notes?: string;
}

export interface CustomerSummary {
  id: number;
  name: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
