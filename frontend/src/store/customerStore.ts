import { create } from "zustand";
import api from "../lib/api";
import type {
  Customer,
  CustomerCreatePayload,
  CustomerSummary,
  PaginatedResponse,
} from "../types";

interface CustomerFilters {
  search?: string;
  customer_type?: string;
  page?: number;
}

interface CustomerState {
  customers: Customer[];
  totalCount: number;
  summary: CustomerSummary[];
  loading: boolean;
  error: string | null;

  fetchCustomers: (filters?: CustomerFilters) => Promise<void>;
  fetchSummary: () => Promise<void>;
  createCustomer: (payload: CustomerCreatePayload) => Promise<void>;
  updateCustomer: (id: number, payload: Partial<CustomerCreatePayload>) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  totalCount: 0,
  summary: [],
  loading: false,
  error: null,

  fetchCustomers: async (filters?: CustomerFilters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.customer_type) params.set("customer_type", filters.customer_type);
      if (filters?.page) params.set("page", String(filters.page));
      const resp = await api.get<PaginatedResponse<Customer>>(`/customers/?${params}`);
      set({ customers: resp.data.results, totalCount: resp.data.count, loading: false });
    } catch {
      set({ error: "Failed to fetch customers", loading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const resp = await api.get<CustomerSummary[]>("/customers/summary/");
      set({ summary: resp.data });
    } catch {
      set({ error: "Failed to fetch customer summary" });
    }
  },

  createCustomer: async (payload: CustomerCreatePayload) => {
    set({ loading: true, error: null });
    try {
      await api.post("/customers/", payload);
      set({ loading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { email?: string[] } } })?.response?.data?.email?.[0] ||
        "Failed to create customer";
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateCustomer: async (id: number, payload: Partial<CustomerCreatePayload>) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/customers/${id}/`, payload);
      set({ loading: false });
    } catch {
      set({ error: "Failed to update customer", loading: false });
    }
  },

  deleteCustomer: async (id: number) => {
    try {
      await api.delete(`/customers/${id}/`);
    } catch {
      set({ error: "Failed to delete customer" });
    }
  },

  clearError: () => set({ error: null }),
}));
