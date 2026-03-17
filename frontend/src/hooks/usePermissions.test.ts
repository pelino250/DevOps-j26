import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { usePermissions } from "./usePermissions";
import { useAuthStore } from "../store/authStore";
import type { User } from "../types";

function makeUser(role: User["role"]): User {
  return {
    id: 1,
    email: "u@test.com",
    first_name: "A",
    last_name: "B",
    role,
    tenant: role === "superadmin" ? null : { id: 1, name: "T", subdomain: "t" },
  };
}

describe("usePermissions", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: false, error: null });
  });

  it("unauthenticated user has no permissions", () => {
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isSuperadmin).toBe(false);
    expect(result.current.canManageTenant).toBe(false);
    expect(result.current.canViewDashboard).toBe(false);
  });

  it("superadmin has full access", () => {
    useAuthStore.setState({ user: makeUser("superadmin") });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isSuperadmin).toBe(true);
    expect(result.current.canManageTenant).toBe(true);
    expect(result.current.canManageTeam).toBe(true);
    expect(result.current.canAccessAdminPanel).toBe(true);
    expect(result.current.canManageUsers).toBe(true);
  });

  it("tenant_admin can manage tenant but not admin panel", () => {
    useAuthStore.setState({ user: makeUser("tenant_admin") });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isTenantAdmin).toBe(true);
    expect(result.current.canManageTenant).toBe(true);
    expect(result.current.canManageUsers).toBe(true);
    expect(result.current.canAccessAdminPanel).toBe(false);
  });

  it("manager can manage team but not users", () => {
    useAuthStore.setState({ user: makeUser("manager") });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isManager).toBe(true);
    expect(result.current.canManageTeam).toBe(true);
    expect(result.current.canApproveExpenses).toBe(true);
    expect(result.current.canManageUsers).toBe(false);
  });

  it("employee can submit expenses but not manage vehicles", () => {
    useAuthStore.setState({ user: makeUser("employee") });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isEmployee).toBe(true);
    expect(result.current.canSubmitExpenses).toBe(true);
    expect(result.current.canManageVehicles).toBe(false);
    expect(result.current.canManageDrivers).toBe(false);
  });

  it("driver cannot submit expenses", () => {
    useAuthStore.setState({ user: makeUser("driver") });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isDriver).toBe(true);
    expect(result.current.canSubmitExpenses).toBe(false);
    expect(result.current.canViewTrips).toBe(true);
    expect(result.current.canManageVehicles).toBe(false);
  });
});
