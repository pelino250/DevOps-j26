import { useAuthStore } from "../store/authStore";
import type { Role } from "../types";

/** Computed boolean flags for RBAC checks in React components. */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role: Role | null = user?.role ?? null;

  return {
    isAuthenticated: user !== null,
    isSuperadmin: role === "superadmin",
    isTenantAdmin: role === "tenant_admin",
    isManager: role === "manager",
    isEmployee: role === "employee",
    isDriver: role === "driver",

    // Compound checks
    canManageTenant: role === "superadmin" || role === "tenant_admin",
    canManageTeam: role === "superadmin" || role === "tenant_admin" || role === "manager",
    canApproveExpenses: role === "superadmin" || role === "tenant_admin" || role === "manager",
    canSubmitExpenses: role !== null && role !== "driver",
    canViewVehicles: role !== null,
    canManageVehicles: role === "superadmin" || role === "tenant_admin" || role === "manager",
    canViewTrips: role !== null,
    canManageDrivers: role === "superadmin" || role === "tenant_admin" || role === "manager",
    canViewOwnProfile: role !== null,
    canManageUsers: role === "superadmin" || role === "tenant_admin",
    canAccessAdminPanel: role === "superadmin",
    canViewDashboard: role !== null,
  };
}
