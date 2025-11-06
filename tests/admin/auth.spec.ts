import { test, expect } from '@playwright/test';
import { loginAsAdmin, verifyLoggedIn } from '../helpers/auth';

/**
 * Admin Authentication & Access Control Tests
 * Tests: A-001, A-002
 */

test.describe('Admin Authentication & Access Control', () => {
  test('A-001: Admin Login', async ({ page }) => {
    const context = await loginAsAdmin(page);
    
    // Verify dashboard is shown
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify navigation includes all links
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /time tracking/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /projects/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /customers/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /users/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /reports/i })).toBeVisible();
  });

  test('A-002: Can Access All Pages', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Test access to all main pages
    const pages = [
      '/dashboard',
      '/time-tracking',
      '/projects',
      '/customers',
      '/users',
      '/reports',
    ];
    
    for (const path of pages) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')), { timeout: 5000 });
      // Verify page loaded (not redirected)
      await expect(page.locator('body')).toBeVisible();
    }
  });
});



