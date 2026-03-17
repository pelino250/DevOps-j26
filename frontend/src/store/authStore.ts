import { create } from "zustand";
import api from "../lib/api";
import type { LoginPayload, RegisterPayload, User } from "../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/login/", payload);
      set({ user: data.user, loading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
        "Login failed";
      set({ error: message, loading: false });
      throw err;
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/register/", payload);
      set({ user: data.user, loading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
        "Registration failed";
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout/");
    } finally {
      set({ user: null, error: null });
    }
  },

  fetchMe: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/auth/me/");
      set({ user: data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
