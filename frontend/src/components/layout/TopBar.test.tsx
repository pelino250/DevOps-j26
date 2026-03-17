import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TopBar } from './TopBar';
import { useAuthStore } from '../../store/authStore';

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('TopBar', () => {
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

  test('renders with FleeMa title', () => {
    render(
      <BrowserRouter>
        <TopBar onMenuClick={() => {}} />
      </BrowserRouter>
    );

    expect(screen.getByText('FleeMa')).toBeInTheDocument();
  });

  test('calls onMenuClick when hamburger menu is clicked', () => {
    const handleMenuClick = vi.fn();
    render(
      <BrowserRouter>
        <TopBar onMenuClick={handleMenuClick} />
      </BrowserRouter>
    );

    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);

    expect(handleMenuClick).toHaveBeenCalledTimes(1);
  });

  test('applies primary background color', () => {
    const { container } = render(
      <BrowserRouter>
        <TopBar onMenuClick={() => {}} />
      </BrowserRouter>
    );

    const topBar = container.firstChild as HTMLElement;
    expect(topBar.className).toContain('bg-primary');
  });

  test.skip('renders user email when user is provided', () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'manager' as const,
      tenant: null,
    };

    render(
      <BrowserRouter>
        <TopBar onMenuClick={() => {}} user={user} />
      </BrowserRouter>
    );

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});
