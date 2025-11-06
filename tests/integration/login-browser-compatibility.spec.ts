import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/fixtures';

/**
 * Cross-Browser Login Compatibility Tests
 * Ensures login flow works across different browsers
 */

test.describe('Login Browser Compatibility', () => {
  test('should login successfully in Chrome', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test');

    const user = TEST_USERS.admin;

    await page.goto('/login');

    await page.fill('input[type="text"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should login successfully in Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');

    const user = TEST_USERS.manager;

    await page.goto('/login');

    await page.fill('input[type="text"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should login successfully in Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');

    const user = TEST_USERS.employee;

    await page.goto('/login');

    await page.fill('input[type="text"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should logout successfully in Chrome', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test');

    const user = TEST_USERS.admin;

    // Login first
    await page.goto('/login');
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

    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await expect(page.getByText(/sign in to worklog/i)).toBeVisible();
  });

  test('should logout successfully in Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');

    const user = TEST_USERS.manager;

    // Login first
    await page.goto('/login');
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

    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await expect(page.getByText(/sign in to worklog/i)).toBeVisible();
  });

  test('should logout successfully in Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');

    const user = TEST_USERS.employee;

    // Login first
    await page.goto('/login');
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

    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await expect(page.getByText(/sign in to worklog/i)).toBeVisible();
  });

  test('should handle form validation consistently across browsers', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.getByText(/username or email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should store and retrieve auth token correctly across browsers', async ({ page }) => {
    const user = TEST_USERS.admin;

    await page.goto('/login');
    await page.fill('input[type="text"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Check token is stored
    const token = await page.evaluate(() => localStorage.getItem('auth-token'));
    expect(token).toBeTruthy();
    expect(token?.length).toBeGreaterThan(0);
  });
});


