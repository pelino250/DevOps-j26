import { create } from 'zustand';
import api from '../lib/api';

export interface Trip {
  id: number;
  vehicle: {
    id: number;
    make: string;
    model: string;
    license_plate: string;
  };
  driver: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  status: 'in_progress' | 'completed' | 'cancelled';
  start_time: string;
  end_time: string | null;
  start_mileage: number;
  end_mileage: number | null;
  start_location: string;
  end_location: string;
  purpose: string;
  fuel_consumed: string | null;
  notes: string;
  distance_km: number | null;
  duration_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface TripStartData {
  vehicle_id: number;
  driver_id: number;
  start_time: string;
  start_mileage: number;
  start_location?: string;
  purpose?: string;
}

export interface TripCompleteData {
  end_time: string;
  end_mileage: number;
  end_location?: string;
  fuel_consumed?: number;
  notes?: string;
}

interface TripState {
  trips: Trip[];
  currentTrip: Trip | null;
  totalCount: number;
  loading: boolean;
  error: string | null;

  fetchTrips: (params?: {
    search?: string;
    status?: string;
    vehicle?: number;
    driver?: number;
    page?: number;
  }) => Promise<void>;
  fetchTrip: (id: number) => Promise<void>;
  startTrip: (data: TripStartData) => Promise<Trip>;
  completeTrip: (id: number, data: TripCompleteData) => Promise<Trip>;
  updateTrip: (id: number, data: Partial<Trip>) => Promise<Trip>;
  cancelTrip: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  trips: [],
  currentTrip: null,
  totalCount: 0,
  loading: false,
  error: null,

  fetchTrips: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.vehicle) queryParams.append('vehicle', params.vehicle.toString());
      if (params.driver) queryParams.append('driver', params.driver.toString());
      if (params.page) queryParams.append('page', params.page.toString());

      const response = await api.get(`/trips/?${queryParams.toString()}`);
      set({
        trips: response.data.results,
        totalCount: response.data.count,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch trips',
        loading: false,
      });
    }
  },

  fetchTrip: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/trips/${id}/`);
      set({ currentTrip: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch trip',
        loading: false,
      });
    }
  },

  startTrip: async (data: TripStartData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/trips/', data);
      set((state) => ({
        trips: [response.data, ...state.trips],
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to start trip';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  completeTrip: async (id: number, data: TripCompleteData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/trips/${id}/complete/`, data);
      set((state) => ({
        trips: state.trips.map((t) => (t.id === id ? response.data : t)),
        currentTrip: state.currentTrip?.id === id ? response.data : state.currentTrip,
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to complete trip';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateTrip: async (id: number, data: Partial<Trip>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/trips/${id}/`, data);
      set((state) => ({
        trips: state.trips.map((t) => (t.id === id ? response.data : t)),
        currentTrip: state.currentTrip?.id === id ? response.data : state.currentTrip,
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update trip';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  cancelTrip: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/trips/${id}/`);
      set((state) => ({
        trips: state.trips.filter((t) => t.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to cancel trip',
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
