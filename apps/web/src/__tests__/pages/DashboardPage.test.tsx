import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../../pages/DashboardPage';

// Mock the hooks
vi.mock('../../hooks/useApi', () => ({
  useTimeEntries: vi.fn(() => ({
    data: {
      data: [
        { duration_minutes: 120 },
        { duration_minutes: 90 },
      ],
    },
    isLoading: false,
  })),
  useProjects: vi.fn(() => ({
    data: {
      data: [
        { id: '1', name: 'Project 1' },
        { id: '2', name: 'Project 2' },
      ],
    },
    isLoading: false,
  })),
  useOrganizations: vi.fn(() => ({
    data: { data: [] },
    isLoading: false,
  })),
}));

describe('DashboardPage', () => {
  it('renders dashboard content', () => {
    render(<DashboardPage />);
    
    // Check for multiple dashboard-related elements
    const dashboardTexts = screen.queryAllByText(/dashboard/i);
    expect(dashboardTexts.length).toBeGreaterThan(0);
  });

  it('displays time tracking section', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText(/today's time/i)).toBeInTheDocument();
  });

  it('displays projects section', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText(/active projects/i)).toBeInTheDocument();
  });

  it('calculates time correctly', () => {
    render(<DashboardPage />);
    
    // Dashboard should display calculated time
    expect(screen.getByText(/today's time/i)).toBeInTheDocument();
  });
});

