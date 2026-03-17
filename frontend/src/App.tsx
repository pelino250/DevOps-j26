import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, GuestOnly } from "./components/RouteGuards";
import { AppLayout } from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import VehiclesPage from "./pages/VehiclesPage";
import VehicleFormPage from "./pages/VehicleFormPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerFormPage from "./pages/CustomerFormPage";
import DriversPage from "./pages/DriversPage";
import DriverFormPage from "./pages/DriverFormPage";
import TripsPage from "./pages/TripsPage";
import TripStartPage from "./pages/TripStartPage";
import TripCompletePage from "./pages/TripCompletePage";

function DashboardPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
      <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>Welcome to FleeMa Fleet Management</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Guest-only routes */}
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Auth-required routes with AppLayout */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<AppLayout><DashboardPlaceholder /></AppLayout>} />
        <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
        <Route path="/vehicles" element={<AppLayout><VehiclesPage /></AppLayout>} />
        <Route path="/vehicles/new" element={<AppLayout><VehicleFormPage /></AppLayout>} />
        <Route path="/vehicles/:id" element={<AppLayout><VehicleDetailPage /></AppLayout>} />
        <Route path="/vehicles/:id/edit" element={<AppLayout><VehicleFormPage /></AppLayout>} />
        <Route path="/customers" element={<AppLayout><CustomersPage /></AppLayout>} />
        <Route path="/customers/new" element={<AppLayout><CustomerFormPage /></AppLayout>} />
        <Route path="/customers/:id/edit" element={<AppLayout><CustomerFormPage /></AppLayout>} />
        <Route path="/drivers" element={<AppLayout><DriversPage /></AppLayout>} />
        <Route path="/drivers/new" element={<AppLayout><DriverFormPage /></AppLayout>} />
        <Route path="/drivers/:id/edit" element={<AppLayout><DriverFormPage /></AppLayout>} />
        <Route path="/trips" element={<AppLayout><TripsPage /></AppLayout>} />
        <Route path="/trips/start" element={<AppLayout><TripStartPage /></AppLayout>} />
        <Route path="/trips/:id/complete" element={<AppLayout><TripCompletePage /></AppLayout>} />
        <Route path="/reports" element={<AppLayout><div>Reports - Coming Soon</div></AppLayout>} />
        <Route path="/settings" element={<AppLayout><div>Settings - Coming Soon</div></AppLayout>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
