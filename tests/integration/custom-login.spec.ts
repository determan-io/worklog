import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/fixtures';

/**
 * Custom Login Flow Tests
 * Tests the Direct Access Grants login flow with custom login form
 */

test.describe('Custom Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should successfully login with username', async ({ page }) => {
    const user = TEST_USERS.admin;

    // Fill in login form
    await page.fill('input[type="text"]', user.email);
    await page.fill('input[type="password"]', user.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Verify user is logged in
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should successfully login with email', async ({ page }) => {
    const user = TEST_USERS.manager;

    // Fill in login form with email
    await page.fill('input[type="text"]', user.email);
    await page.fill('input[type="password"]', user.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Verify user is logged in
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should login with remember me checked', async ({ page }) => {
    const user = TEST_USERS.employee;

    // Fill in login form
    await page.fill('input[type="text"]', user.email);
    await page.fill('input[type="password"]', user.password);

    // Check remember me checkbox
    await page.check('input[type="checkbox"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Verify remember me preference is stored
    const rememberMe = await page.evaluate(() => localStorage.getItem('remember-me'));
    expect(rememberMe).toBe('true');
  });

  test('should show validation error for empty username/email', async ({ page }) => {
    // Try to submit without filling fields
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.getByText(/username or email is required/i)).toBeVisible();
  });

  test('should show validation error for empty password', async ({ page }) => {
    const user = TEST_USERS.admin;

    // Fill only username
    await page.fill('input[type="text"]', user.email);

    // Try to submit
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    // Fill invalid email
    await page.fill('input[type="text"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');

    // Try to submit
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(
      page.getByText(/please enter a valid email address or username/i)
    ).toBeVisible();
  });

  test('should show validation error for password too short', async ({ page }) => {
    const user = TEST_USERS.admin;

    // Fill form with short password
    await page.fill('input[type="text"]', user.email);
    await page.fill('input[type="password"]', '12345'); // Less than 6 characters

    // Try to submit
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.getByText(/password must be at least 6 characters/i)).toBeVisible();
  });

  test('should show error message on failed login with invalid credentials', async ({ page }) => {
    // Fill form with invalid credentials
    await page.fill('input[type="text"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.getByText(/invalid username or password|login failed/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should toggle password visibility', async ({ page }) => {
    const user = TEST_USERS.admin;

    // Fill password
    await page.fill('input[type="password"]', user.password);

    // Get password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Find and click eye icon button
    const passwordContainer = page.locator('.relative').first();
    const toggleButton = passwordContainer.locator('button[type="button"]').first();
    await toggleButton.click();

    // Password should now be visible
    await expect(page.locator('input[type="text"]').filter({ hasText: user.password })).toBeVisible();
  });

  test('should have forgot password link', async ({ page }) => {
    const forgotPasswordLink = page.getByText(/forgot password/i);
    await expect(forgotPasswordLink).toBeVisible();
    await expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    const forgotPasswordLink = page.getByText(/forgot password/i);
    await forgotPasswordLink.click();

    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByText(/reset password/i)).toBeVisible();
  });

  test('logout flow should work correctly', async ({ page }) => {
    const user = TEST_USERS.admin;

    // Login first
    await page.fill('input[type="text"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Click on user menu button (initials)
    const userMenuButton = page.locator('button').filter({ hasText: /AU|MU|EU/i }).first();
    if (await userMenuButton.count() > 0) {
      await userMenuButton.click();
    }

    // Click sign out
    const signOutButton = page.getByRole('button', { name: /sign out/i });
    await expect(signOutButton).toBeVisible({ timeout: 2000 });
    await signOutButton.click();

    // Should redirect to login with logout param
    await page.waitForURL(/\/login.*logout=true|\/login/, { timeout: 15000 });

    // Verify we're on login page
    await expect(page.getByText(/sign in to worklog/i)).toBeVisible();
  });

  test('should not auto-login after logout', async ({ page }) => {
    const user = TEST_USERS.admin;

    // Login first
    await page.fill('input[type="text"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Logout
    const userMenuButton = page.locator('button').filter({ hasText: /AU|MU|EU/i }).first();
    if (await userMenuButton.count() > 0) {
      await userMenuButton.click();
    }

    const signOutButton = page.getByRole('button', { name: /sign out/i });
    await signOutButton.click();

    // Wait for logout redirect
    await page.waitForURL(/\/login/, { timeout: 15000 });

    // Should stay on login page, not redirect to dashboard
    await expect(page.getByText(/sign in to worklog/i)).toBeVisible();
    
    // Should not see dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).not.toBeVisible();
  });

  test('should display logout success message after logout', async ({ page }) => {
    const user = TEST_USERS.admin;

    // Login first
    await page.fill('input[type="text"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Logout
    const userMenuButton = page.locator('button').filter({ hasText: /AU|MU|EU/i }).first();
    if (await userMenuButton.count() > 0) {
      await userMenuButton.click();
    }

    const signOutButton = page.getByRole('button', { name: /sign out/i });
    await signOutButton.click();

    // Wait for logout redirect
    await page.waitForURL(/\/login/, { timeout: 15000 });

    // Should see logout success message
    await expect(
      page.getByText(/you have been signed out successfully/i)
    ).toBeVisible({ timeout: 5000 });
  });
});


