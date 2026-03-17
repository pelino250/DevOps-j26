import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";
import type { User } from "../types";

const mockUser: User = {
  id: 1,
  email: "admin@test.com",
  first_name: "Test",
  last_name: "Admin",
  role: "tenant_admin",
  tenant: { id: 1, name: "Test Co", subdomain: "test-co" },
};

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store state between tests
    useAuthStore.setState({ user: null, loading: false, error: null });
  });

  it("starts with null user", () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("clearError resets error to null", () => {
    useAuthStore.setState({ error: "something went wrong" });
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.error).toBe("something went wrong");
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it("logout clears user", async () => {
    useAuthStore.setState({ user: mockUser });
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).not.toBeNull();

    // logout calls api.post which will fail without mock, but finally block clears user
    await act(async () => {
      try {
        await result.current.logout();
      } catch {
        // expected — no server
      }
    });
    expect(result.current.user).toBeNull();
  });
});
