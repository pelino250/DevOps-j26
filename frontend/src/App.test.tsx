import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { useAuthStore } from './store/authStore';

vi.mock('./components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('./store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      const mockState = {
        user: null,
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
  });

  test('redirects unauthenticated user to login', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });

  test('shows login form at /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('FleeMa')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  test('shows register form at /register', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Create Account').length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
  });

  test('authenticated user sees dashboard', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      const mockState = {
        user: {
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'manager',
          tenant: null,
        },
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

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('authenticated user at /login is redirected to dashboard', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      const mockState = {
        user: {
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'manager',
          tenant: null,
        },
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

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('authenticated user sees profile page', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      const mockState = {
        user: {
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'manager',
          tenant: null,
        },
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

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
  });
});
