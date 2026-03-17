import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';

describe('AppLayout', () => {
  test('renders children content', () => {
    render(
      <BrowserRouter>
        <AppLayout>
          <div>Test content</div>
        </AppLayout>
      </BrowserRouter>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('renders sidebar navigation', () => {
    render(
      <BrowserRouter>
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Vehicles')).toBeInTheDocument();
  });

  test('renders top bar', () => {
    render(
      <BrowserRouter>
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      </BrowserRouter>
    );

    const fleemaElements = screen.getAllByText('FleeMa');
    expect(fleemaElements.length).toBeGreaterThan(0);
  });

  test('applies correct layout structure', () => {
    const { container } = render(
      <BrowserRouter>
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      </BrowserRouter>
    );

    const layout = container.firstChild as HTMLElement;
    expect(layout.className).toContain('flex');
    expect(layout.className).toContain('h-screen');
  });
});
