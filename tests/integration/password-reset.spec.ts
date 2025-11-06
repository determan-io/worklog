import { test, expect } from '@playwright/test';

/**
 * Password Reset Flow Tests
 * Tests the password reset functionality
 */

test.describe('Password Reset Flow', () => {
  test('should display forgot password form', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.getByText(/reset password/i)).toBeVisible();
    await expect(page.getByLabelText(/email address/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset instructions/i })).toBeVisible();
    await expect(page.getByText(/back to login/i)).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.goto('/forgot-password');

    const submitButton = page.getByRole('button', { name: /send reset instructions/i });
    await submitButton.click();

    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.goto('/forgot-password');

    const emailInput = page.getByLabelText(/email address/i);
    await emailInput.fill('invalid-email');

    const submitButton = page.getByRole('button', { name: /send reset instructions/i });
    await submitButton.click();

    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible();
  });

  test('should submit password reset request', async ({ page }) => {
    await page.goto('/forgot-password');

    // Mock the fetch request for password reset
    await page.route('**/login-actions/reset-credentials*', async (route) => {
      await route.fulfill({
        status: 200,
        body: 'OK',
      });
    });

    const emailInput = page.getByLabelText(/email address/i);
    await emailInput.fill('test@example.com');

    const submitButton = page.getByRole('button', { name: /send reset instructions/i });
    await submitButton.click();

    // Should show success message
    await expect(
      page.getByText(/if an account exists with that email address/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on failed password reset request', async ({ page }) => {
    await page.goto('/forgot-password');

    // Mock the fetch request to fail
    await page.route('**/login-actions/reset-credentials*', async (route) => {
      await route.fulfill({
        status: 400,
        body: 'Error',
      });
    });

    const emailInput = page.getByLabelText(/email address/i);
    await emailInput.fill('test@example.com');

    const submitButton = page.getByRole('button', { name: /send reset instructions/i });
    await submitButton.click();

    // Should show error message
    await expect(page.getByText(/failed to send password reset email/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate back to login from forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');

    const backToLoginLink = page.getByText(/back to login/i);
    await backToLoginLink.click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/sign in to worklog/i)).toBeVisible();
  });

  test('should display reset password form when token is present', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token-123');

    await expect(page.getByText(/reset password/i)).toBeVisible();
    await expect(page.getByLabelText(/new password/i)).toBeVisible();
    await expect(page.getByLabelText(/confirm new password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /reset password/i })).toBeVisible();
  });

  test('should show error when reset password token is missing', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(
      page.getByText(/invalid or missing password reset token/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for empty password', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token-123');

    const submitButton = page.getByRole('button', { name: /reset password/i });
    await submitButton.click();

    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should show validation error for password too short', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token-123');

    const passwordInput = page.getByLabelText(/new password/i);
    await passwordInput.fill('1234567'); // Less than 8 characters

    const submitButton = page.getByRole('button', { name: /reset password/i });
    await submitButton.click();

    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
  });

  test('should show validation error when passwords do not match', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token-123');

    const passwordInput = page.getByLabelText(/new password/i);
    const confirmPasswordInput = page.getByLabelText(/confirm new password/i);

    await passwordInput.fill('newpassword123');
    await confirmPasswordInput.fill('differentpassword');

    const submitButton = page.getByRole('button', { name: /reset password/i });
    await submitButton.click();

    await expect(page.getByText(/passwords don't match/i)).toBeVisible();
  });

  test('should submit password reset with valid token', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token-123');

    // Mock the fetch request for password reset
    await page.route('**/login-actions/reset-password*', async (route) => {
      await route.fulfill({
        status: 200,
        body: 'OK',
      });
    });

    const passwordInput = page.getByLabelText(/new password/i);
    const confirmPasswordInput = page.getByLabelText(/confirm new password/i);

    await passwordInput.fill('newpassword123');
    await confirmPasswordInput.fill('newpassword123');

    const submitButton = page.getByRole('button', { name: /reset password/i });
    await submitButton.click();

    // Should show success message
    await expect(page.getByText(/password reset successfully/i)).toBeVisible({
      timeout: 10000,
    });

    // Should redirect to login after delay
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should show error for invalid reset token', async ({ page }) => {
    await page.goto('/reset-password?token=invalid-token');

    // Mock the fetch request to return invalid token error
    await page.route('**/login-actions/reset-password*', async (route) => {
      await route.fulfill({
        status: 400,
        body: 'Invalid token',
      });
    });

    const passwordInput = page.getByLabelText(/new password/i);
    const confirmPasswordInput = page.getByLabelText(/confirm new password/i);

    await passwordInput.fill('newpassword123');
    await confirmPasswordInput.fill('newpassword123');

    const submitButton = page.getByRole('button', { name: /reset password/i });
    await submitButton.click();

    // Should show error message
    await expect(
      page.getByText(/password reset token is invalid or has expired/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show error for expired reset token', async ({ page }) => {
    await page.goto('/reset-password?token=expired-token');

    // Mock the fetch request to return expired token error
    await page.route('**/login-actions/reset-password*', async (route) => {
      await route.fulfill({
        status: 400,
        body: 'Token expired',
      });
    });

    const passwordInput = page.getByLabelText(/new password/i);
    const confirmPasswordInput = page.getByLabelText(/confirm new password/i);

    await passwordInput.fill('newpassword123');
    await confirmPasswordInput.fill('newpassword123');

    const submitButton = page.getByRole('button', { name: /reset password/i });
    await submitButton.click();

    // Should show error message
    await expect(
      page.getByText(/password reset token is invalid or has expired/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should toggle password visibility in reset form', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token-123');

    const passwordInput = page.getByLabelText(/new password/i);
    await passwordInput.fill('newpassword123');

    // Get password input type
    const inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('password');

    // Find and click eye icon button
    const passwordContainer = passwordInput.locator('..').locator('.relative').first();
    const toggleButton = passwordContainer.locator('button[type="button"]').first();
    await toggleButton.click();

    // Password should now be visible
    const newInputType = await passwordInput.getAttribute('type');
    expect(newInputType).toBe('text');
  });

  test('should navigate back to login from reset password page', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token-123');

    const backToLoginLink = page.getByText(/back to login/i);
    await backToLoginLink.click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/sign in to worklog/i)).toBeVisible();
  });

  test('should display password requirements hint', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token-123');

    await expect(page.getByText(/password must be at least 8 characters long/i)).toBeVisible();
  });
});


