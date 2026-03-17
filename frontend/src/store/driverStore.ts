import { create } from 'zustand';
import api from '../lib/api';

export interface DriverProfile {
  id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  license_number: string;
  license_expiry: string;
  license_class: string;
  date_of_birth: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DriverFormData {
  user_id: number;
  license_number: string;
  license_expiry: string;
  license_class: string;
  date_of_birth: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes?: string;
}

interface DriverState {
  drivers: DriverProfile[];
  currentDriver: DriverProfile | null;
  totalCount: number;
  loading: boolean;
  error: string | null;

  fetchDrivers: (params?: { search?: string; page?: number }) => Promise<void>;
  fetchDriver: (id: number) => Promise<void>;
  createDriver: (data: DriverFormData) => Promise<DriverProfile>;
  updateDriver: (id: number, data: Partial<DriverFormData>) => Promise<DriverProfile>;
  deleteDriver: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useDriverStore = create<DriverState>((set) => ({
  drivers: [],
  currentDriver: null,
  totalCount: 0,
  loading: false,
  error: null,

  fetchDrivers: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page.toString());

      const response = await api.get(`/drivers/?${queryParams.toString()}`);
      set({
        drivers: response.data.results,
        totalCount: response.data.count,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch drivers',
        loading: false,
      });
    }
  },

  fetchDriver: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/drivers/${id}/`);
      set({ currentDriver: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch driver',
        loading: false,
      });
    }
  },

  createDriver: async (data: DriverFormData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/drivers/', data);
      set((state) => ({
        drivers: [response.data, ...state.drivers],
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create driver';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateDriver: async (id: number, data: Partial<DriverFormData>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/drivers/${id}/`, data);
      set((state) => ({
        drivers: state.drivers.map((d) => (d.id === id ? response.data : d)),
        currentDriver: state.currentDriver?.id === id ? response.data : state.currentDriver,
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update driver';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteDriver: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/drivers/${id}/`);
      set((state) => ({
        drivers: state.drivers.filter((d) => d.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to delete driver',
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
