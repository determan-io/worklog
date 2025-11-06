import { Page, expect } from '@playwright/test';
import { TEST_USERS, KEYCLOAK_CONFIG } from './fixtures';

/**
 * Authentication helper functions for E2E tests
 */

export type UserRole = 'employee' | 'manager' | 'admin';

export interface AuthenticatedContext {
  page: Page;
  token: string;
  user: typeof TEST_USERS.employee | typeof TEST_USERS.manager | typeof TEST_USERS.admin;
}

/**
 * Login as a specific user role via Direct Access Grants (custom login form)
 */
export async function loginAsRole(
  page: Page,
  role: UserRole
): Promise<AuthenticatedContext> {
  const user = TEST_USERS[role];

  // Navigate to login page
  await page.goto('/login');

  // Wait for login form to be visible
  await expect(page.getByLabelText(/username or email/i)).toBeVisible({ timeout: 5000 });

  // Fill in login form
  await page.fill('input[type="text"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Click sign in button
  const signInButton = page.getByRole('button', { name: /sign in/i });
  await expect(signInButton).toBeVisible();
  await signInButton.click();

  // Wait for redirect to dashboard after authentication
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });

  // Wait a bit for token to be stored
  await page.waitForTimeout(500);

  // Get the auth token from localStorage
  const token = await page.evaluate(() => localStorage.getItem('auth-token'));

  if (!token) {
    throw new Error('Failed to retrieve authentication token after login');
  }

  return {
    page,
    token,
    user,
  };
}

/**
 * Login as employee
 */
export async function loginAsEmployee(page: Page): Promise<AuthenticatedContext> {
  return loginAsRole(page, 'employee');
}

/**
 * Login as manager
 */
export async function loginAsManager(page: Page): Promise<AuthenticatedContext> {
  return loginAsRole(page, 'manager');
}

/**
 * Login as admin
 */
export async function loginAsAdmin(page: Page): Promise<AuthenticatedContext> {
  return loginAsRole(page, 'admin');
}

/**
 * Logout from the application
 */
export async function logout(page: Page): Promise<void> {
  // Click on user menu button
  const userMenuButton = page.locator('button:has-text("Admin")').or(
    page.locator('button:has-text("Manager")')
  ).or(
    page.locator('button:has-text("Employee")')
  );

  if (await userMenuButton.count() > 0) {
    await userMenuButton.first().click();
  } else {
    // Try to find user menu by other means
    const userMenu = page.locator('[class*="user-menu"]').or(
      page.locator('button[aria-label*="user"]')
    );
    
    if (await userMenu.count() > 0) {
      await userMenu.first().click();
    }
  }

  // Click sign out button
  const signOutButton = page.getByRole('button', { name: /sign out/i }).or(
    page.getByText(/sign out/i)
  );
  
  await expect(signOutButton).toBeVisible({ timeout: 2000 });
  await signOutButton.click();

  // Wait for redirect to login
  await page.waitForURL(/\/login|\//, { timeout: 5000 });
}

/**
 * Verify user is logged in and sees expected navigation
 */
export async function verifyLoggedIn(
  page: Page,
  role: UserRole
): Promise<void> {
  await expect(page).toHaveURL(/\/dashboard/);

  // Verify user sees dashboard
  const dashboardHeading = page.getByRole('heading', { name: /dashboard/i });
  await expect(dashboardHeading).toBeVisible();

  // Verify navigation based on role
  const dashboardLink = page.getByRole('link', { name: /dashboard/i });
  await expect(dashboardLink).toBeVisible();

  const timeTrackingLink = page.getByRole('link', { name: /time tracking/i });
  await expect(timeTrackingLink).toBeVisible();

  const projectsLink = page.getByRole('link', { name: /projects/i });
  await expect(projectsLink).toBeVisible();

  if (role === 'employee') {
    // Employees should NOT see Customers and Users links
    const customersLink = page.getByRole('link', { name: /customers/i });
    await expect(customersLink).not.toBeVisible();

    const usersLink = page.getByRole('link', { name: /users/i });
    await expect(usersLink).not.toBeVisible();
  } else {
    // Managers and Admins should see all navigation links
    const customersLink = page.getByRole('link', { name: /customers/i });
    await expect(customersLink).toBeVisible();

    const usersLink = page.getByRole('link', { name: /users/i });
    await expect(usersLink).toBeVisible();
  }
}

/**
 * Create authenticated context with storage state
 */
export async function createAuthenticatedContext(
  page: Page,
  role: UserRole
): Promise<AuthenticatedContext> {
  const context = await loginAsRole(page, role);
  
  // Save authentication state
  await page.context().storageState({ path: `tests/.auth/${role}.json` });
  
  return context;
}

