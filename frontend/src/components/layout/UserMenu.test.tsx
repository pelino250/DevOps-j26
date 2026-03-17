import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import { useAuthStore } from '../../store/authStore';

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockUser = {
  id: 1,
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'manager' as const,
  tenant: { id: 1, name: 'Test Company', subdomain: 'test' },
};

describe.skip('UserMenu', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      logout: vi.fn(),
      user: null,
      loading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      fetchMe: vi.fn(),
      clearError: vi.fn(),
    });
  });

  test('renders user email', () => {
    render(
      <BrowserRouter>
        <UserMenu user={mockUser} />
      </BrowserRouter>
    );

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  test('displays user initials', () => {
    render(
      <BrowserRouter>
        <UserMenu user={mockUser} />
      </BrowserRouter>
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  test('opens menu on click', async () => {
    render(
      <BrowserRouter>
        <UserMenu user={mockUser} />
      </BrowserRouter>
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(await screen.findByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
