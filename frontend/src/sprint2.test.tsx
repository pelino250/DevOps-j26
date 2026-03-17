import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import App from "./App";
import { useAuthStore } from "./store/authStore";
import { useVehicleStore } from "./store/vehicleStore";
import { useCustomerStore } from "./store/customerStore";
import type { User, Vehicle, Customer } from "./types";

vi.mock('./components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('./store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const testUser: User = {
  id: 1,
  email: "a@b.com",
  first_name: "A",
  last_name: "B",
  role: "tenant_admin",
  tenant: { id: 1, name: "T", subdomain: "t" },
};

const testVehicle: Vehicle = {
  id: 1,
  make: "Toyota",
  model: "Hilux",
  year: 2023,
  license_plate: "ABC-123",
  vin: "VIN001",
  fuel_type: "diesel",
  status: "active",
  current_mileage: 50000,
  baseline_fuel_consumption: 8.5,
  assigned_driver: null,
  assigned_driver_email: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const testCustomer: Customer = {
  id: 1,
  customer_type: "business",
  name: "Acme Corp",
  email: "info@acme.com",
  phone: "+254700000000",
  address: "123 Main St",
  tax_id: "TAX001",
  contact_person: "John",
  notes: "",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// Mock fetch functions to prevent real API calls
const mockFetchVehicles = vi.fn();
const mockFetchCustomers = vi.fn();
const mockFetchVehicle = vi.fn();

// Helper to mock authenticated user
const mockAuthUser = (user: typeof testUser | null) => {
  vi.mocked(useAuthStore).mockImplementation((selector: any) => {
    const mockState = {
      user,
      loading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      fetchMe: vi.fn(),
      clearError: vi.fn(),
    };
    return selector ? selector(mockState) : mockState;
  });
};

beforeEach(() => {
  mockAuthUser(null);

  useVehicleStore.setState({
    vehicles: [],
    totalCount: 0,
    currentVehicle: null,
    loading: false,
    error: null,
  });
  useCustomerStore.setState({
    customers: [],
    totalCount: 0,
    summary: [],
    loading: false,
    error: null,
  });
  mockFetchVehicles.mockReset();
  mockFetchCustomers.mockReset();
  mockFetchVehicle.mockReset();
});

describe("Vehicle pages routing", () => {
  it("authenticated user sees vehicles page at /vehicles", () => {
    mockAuthUser(testUser);
    useVehicleStore.setState({
      vehicles: [testVehicle],
      totalCount: 1,
      fetchVehicles: mockFetchVehicles,
    });
    render(
      <MemoryRouter initialEntries={["/vehicles"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Vehicles" })).toBeInTheDocument();
    expect(screen.getByText(/Toyota/)).toBeTruthy();
  });

  it("vehicles page shows search and filter controls", () => {
    mockAuthUser(testUser);
    useVehicleStore.setState({
      vehicles: [],
      totalCount: 0,
      fetchVehicles: mockFetchVehicles,
    });
    render(
      <MemoryRouter initialEntries={["/vehicles"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText("Search make, model, plate...")).toBeInTheDocument();
    expect(screen.getByDisplayValue("All")).toBeInTheDocument();
  });

  it("vehicles page shows empty state", () => {
    mockAuthUser(testUser);
    useVehicleStore.setState({
      vehicles: [],
      totalCount: 0,
      fetchVehicles: mockFetchVehicles,
    });
    render(
      <MemoryRouter initialEntries={["/vehicles"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("No vehicles found.")).toBeInTheDocument();
  });

  it("vehicle list shows status badge and mileage", () => {
    mockAuthUser(testUser);
    useVehicleStore.setState({
      vehicles: [testVehicle],
      totalCount: 1,
      fetchVehicles: mockFetchVehicles,
    });
    render(
      <MemoryRouter initialEntries={["/vehicles"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("50,000 km")).toBeInTheDocument();
  });

  it("authenticated user sees add vehicle form at /vehicles/new", () => {
    mockAuthUser(testUser);
    render(
      <MemoryRouter initialEntries={["/vehicles/new"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Add Vehicle" })).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("vehicle form has all required fields", () => {
    mockAuthUser(testUser);
    render(
      <MemoryRouter initialEntries={["/vehicles/new"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("Make")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.getByText("Year")).toBeInTheDocument();
    expect(screen.getByText("License Plate")).toBeInTheDocument();
    expect(screen.getByText("Fuel Type")).toBeInTheDocument();
  });

  it("vehicle detail page shows loading when no vehicle", () => {
    mockAuthUser(testUser);
    useVehicleStore.setState({
      currentVehicle: null,
      loading: false,
      fetchVehicle: mockFetchVehicle,
    });
    render(
      <MemoryRouter initialEntries={["/vehicles/1"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("Vehicle not found.")).toBeInTheDocument();
  });

  it("vehicle detail page shows vehicle info with tabs", () => {
    mockAuthUser(testUser);
    useVehicleStore.setState({
      currentVehicle: {
        ...testVehicle,
        documents: [],
        status_history: [],
      },
      loading: false,
      fetchVehicle: mockFetchVehicle,
    });
    render(
      <MemoryRouter initialEntries={["/vehicles/1"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("2023 Toyota Hilux")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
  });

  it("vehicle edit form at /vehicles/:id/edit shows Edit Vehicle heading", () => {
    mockAuthUser(testUser);
    useVehicleStore.setState({
      currentVehicle: {
        ...testVehicle,
        documents: [],
        status_history: [],
      },
      fetchVehicle: mockFetchVehicle,
    });
    render(
      <MemoryRouter initialEntries={["/vehicles/1/edit"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Edit Vehicle" })).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  it("unauthenticated user cannot access /vehicles", () => {
    render(
      <MemoryRouter initialEntries={["/vehicles"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });
});

describe("Customer pages routing", () => {
  it("authenticated user sees customers page at /customers", () => {
    mockAuthUser(testUser);
    useCustomerStore.setState({
      customers: [testCustomer],
      totalCount: 1,
      fetchCustomers: mockFetchCustomers,
    });
    render(
      <MemoryRouter initialEntries={["/customers"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Customers" })).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
  });

  it("customers page shows search and filter controls", () => {
    mockAuthUser(testUser);
    useCustomerStore.setState({
      customers: [],
      totalCount: 0,
      fetchCustomers: mockFetchCustomers,
    });
    render(
      <MemoryRouter initialEntries={["/customers"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText("Search name, email, phone...")).toBeInTheDocument();
    expect(screen.getByDisplayValue("All")).toBeInTheDocument();
  });

  it("customers page shows empty state", () => {
    mockAuthUser(testUser);
    useCustomerStore.setState({
      customers: [],
      totalCount: 0,
      fetchCustomers: mockFetchCustomers,
    });
    render(
      <MemoryRouter initialEntries={["/customers"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("No customers found.")).toBeInTheDocument();
  });

  it("customer list shows type icon and email", () => {
    mockAuthUser(testUser);
    useCustomerStore.setState({
      customers: [testCustomer],
      totalCount: 1,
      fetchCustomers: mockFetchCustomers,
    });
    render(
      <MemoryRouter initialEntries={["/customers"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("business")).toBeInTheDocument();
    expect(screen.getByText("info@acme.com")).toBeInTheDocument();
  });

  it("authenticated user sees add customer form at /customers/new", () => {
    mockAuthUser(testUser);
    render(
      <MemoryRouter initialEntries={["/customers/new"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Add Customer" })).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("customer form has all required fields", () => {
    mockAuthUser(testUser);
    render(
      <MemoryRouter initialEntries={["/customers/new"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
  });

  it("customer edit form shows Edit Customer heading", () => {
    mockAuthUser(testUser);
    useCustomerStore.setState({
      customers: [testCustomer],
      totalCount: 1,
      fetchCustomers: mockFetchCustomers,
    });
    render(
      <MemoryRouter initialEntries={["/customers/1/edit"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Edit Customer" })).toBeInTheDocument();
  });

  it("unauthenticated user cannot access /customers", () => {
    render(
      <MemoryRouter initialEntries={["/customers"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });
});
