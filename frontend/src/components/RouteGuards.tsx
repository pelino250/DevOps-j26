import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/** Redirects unauthenticated users to /login. */
export function RequireAuth() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Redirects authenticated users to /dashboard. */
export function GuestOnly() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
