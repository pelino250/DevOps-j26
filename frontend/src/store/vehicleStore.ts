import { create } from "zustand";
import api from "../lib/api";
import type {
  PaginatedResponse,
  Vehicle,
  VehicleCreatePayload,
  VehicleDetail,
} from "../types";

interface VehicleFilters {
  search?: string;
  status?: string;
  fuel_type?: string;
  page?: number;
}

interface VehicleState {
  vehicles: Vehicle[];
  totalCount: number;
  currentVehicle: VehicleDetail | null;
  loading: boolean;
  error: string | null;

  fetchVehicles: (filters?: VehicleFilters) => Promise<void>;
  fetchVehicle: (id: number) => Promise<void>;
  createVehicle: (payload: VehicleCreatePayload) => Promise<void>;
  updateVehicle: (id: number, payload: Partial<VehicleCreatePayload>) => Promise<void>;
  deleteVehicle: (id: number) => Promise<void>;
  changeStatus: (id: number, status: string) => Promise<void>;
  assignDriver: (id: number, driverId: number) => Promise<void>;
  unassignDriver: (id: number) => Promise<void>;
  updateMileage: (id: number, mileage: number) => Promise<void>;
  clearError: () => void;
}

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],
  totalCount: 0,
  currentVehicle: null,
  loading: false,
  error: null,

  fetchVehicles: async (filters?: VehicleFilters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.fuel_type) params.set("fuel_type", filters.fuel_type);
      if (filters?.page) params.set("page", String(filters.page));
      const resp = await api.get<PaginatedResponse<Vehicle>>(`/vehicles/?${params}`);
      set({ vehicles: resp.data.results, totalCount: resp.data.count, loading: false });
    } catch {
      set({ error: "Failed to fetch vehicles", loading: false });
    }
  },

  fetchVehicle: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const resp = await api.get<VehicleDetail>(`/vehicles/${id}/`);
      set({ currentVehicle: resp.data, loading: false });
    } catch {
      set({ error: "Failed to fetch vehicle", loading: false });
    }
  },

  createVehicle: async (payload: VehicleCreatePayload) => {
    set({ loading: true, error: null });
    try {
      await api.post("/vehicles/", payload);
      set({ loading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { license_plate?: string[] } } })?.response?.data
          ?.license_plate?.[0] || "Failed to create vehicle";
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateVehicle: async (id: number, payload: Partial<VehicleCreatePayload>) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/vehicles/${id}/`, payload);
      set({ loading: false });
    } catch {
      set({ error: "Failed to update vehicle", loading: false });
    }
  },

  deleteVehicle: async (id: number) => {
    try {
      await api.delete(`/vehicles/${id}/`);
    } catch {
      set({ error: "Failed to delete vehicle" });
    }
  },

  changeStatus: async (id: number, status: string) => {
    set({ error: null });
    try {
      const resp = await api.patch<Vehicle>(`/vehicles/${id}/status/`, { status });
      set((state) => ({
        vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, status: resp.data.status } : v)),
      }));
    } catch {
      set({ error: "Failed to change status" });
    }
  },

  assignDriver: async (id: number, driverId: number) => {
    set({ error: null });
    try {
      await api.patch(`/vehicles/${id}/assign-driver/`, { driver_id: driverId });
    } catch {
      set({ error: "Failed to assign driver" });
    }
  },

  unassignDriver: async (id: number) => {
    set({ error: null });
    try {
      await api.patch(`/vehicles/${id}/unassign-driver/`);
    } catch {
      set({ error: "Failed to unassign driver" });
    }
  },

  updateMileage: async (id: number, mileage: number) => {
    set({ error: null });
    try {
      await api.patch(`/vehicles/${id}/mileage/`, { mileage });
    } catch {
      set({ error: "Failed to update mileage" });
    }
  },

  clearError: () => set({ error: null }),
}));
