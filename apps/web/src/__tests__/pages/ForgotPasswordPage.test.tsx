import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ForgotPasswordPage from '../../pages/ForgotPasswordPage';
import * as authService from '../../services/authService';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  requestPasswordReset: vi.fn(),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const MockedForgotPasswordPage = () => (
  <BrowserRouter>
    <ForgotPasswordPage />
  </BrowserRouter>
);

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders forgot password form', () => {
    render(<MockedForgotPasswordPage />);

    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset instructions/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('displays correct heading and description', () => {
    render(<MockedForgotPasswordPage />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Reset Password');
    expect(
      screen.getByText(/enter your email address and we'll send you instructions/i)
    ).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    render(<MockedForgotPasswordPage />);

    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<MockedForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('calls requestPasswordReset on form submission with valid email', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.requestPasswordReset).mockResolvedValueOnce(undefined);

    render(<MockedForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.requestPasswordReset).mockResolvedValueOnce(undefined);

    render(<MockedForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/if an account exists with that email address/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/back to login/i)).toBeInTheDocument();
    });
  });

  it('displays error message on failed request', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.requestPasswordReset).mockRejectedValueOnce(
      new Error('Failed to send password reset email')
    );

    render(<MockedForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to send password reset email/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.requestPasswordReset).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(undefined);
          }, 100);
        })
    );

    render(<MockedForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    await user.click(submitButton);

    expect(screen.getByText(/sending/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('has link back to login page', () => {
    render(<MockedForgotPasswordPage />);

    const backToLoginLink = screen.getByText(/back to login/i);
    expect(backToLoginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('hides form and shows success message after successful submission', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.requestPasswordReset).mockResolvedValueOnce(undefined);

    render(<MockedForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /send reset instructions/i })).not.toBeInTheDocument();
    });
  });
});


