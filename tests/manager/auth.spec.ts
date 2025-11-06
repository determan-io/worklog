import { test, expect } from '@playwright/test';
import { loginAsManager, verifyLoggedIn } from '../helpers/auth';

/**
 * Manager Authentication & Access Control Tests
 * Tests: M-001, M-002
 */

test.describe('Manager Authentication & Access Control', () => {
  test('M-001: Manager Login', async ({ page }) => {
    const context = await loginAsManager(page);
    
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

  test('M-002: Can Access All Pages', async ({ page }) => {
    await loginAsManager(page);
    
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

