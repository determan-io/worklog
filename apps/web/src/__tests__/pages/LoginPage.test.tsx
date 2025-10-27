import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({
    login: vi.fn(),
  }),
}));

const MockedLoginPage = () => (
  <BrowserRouter>
    <LoginPage />
  </BrowserRouter>
);

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<MockedLoginPage />);
    
    expect(screen.getByText(/sign in to worklog/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keycloak/i })).toBeInTheDocument();
  });

  it('displays correct heading', () => {
    render(<MockedLoginPage />);
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Sign in to WorkLog');
  });

  it('has a working Keycloak login button', () => {
    const { container } = render(<MockedLoginPage />);
    
    const keycloakButton = screen.getByRole('button', { name: /keycloak/i });
    expect(keycloakButton).toBeInTheDocument();
    expect(container.querySelector('button')).toBeInTheDocument();
  });
});

