import { test, expect } from '@playwright/test';
import { loginAsEmployee, verifyLoggedIn } from '../helpers/auth';

/**
 * Employee Authentication & Access Control Tests
 * Tests: E-001 through E-005
 */

test.describe('Employee Authentication & Access Control', () => {
  test('E-001: Employee Login', async ({ page }) => {
    const context = await loginAsEmployee(page);
    
    // Verify dashboard is shown
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify user name appears
    await expect(page.getByText(/employee one/i)).toBeVisible();
    
    // Verify navigation includes Dashboard, Time Tracking, Projects, Reports
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /time tracking/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /projects/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /reports/i })).toBeVisible();
    
    // Verify employees do NOT see Customers and Users links
    await expect(page.getByRole('link', { name: /customers/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /users/i })).not.toBeVisible();
  });

  test('E-002: Cannot Access Customers Page', async ({ page }) => {
    await loginAsEmployee(page);
    
    // Try to navigate to customers page
    await page.goto('/customers');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('E-003: Cannot Access Users Page', async ({ page }) => {
    await loginAsEmployee(page);
    
    // Try to navigate to users page
    await page.goto('/users');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('E-004: Cannot Access User Detail Pages', async ({ page }) => {
    await loginAsEmployee(page);
    
    // Try to navigate to user create page
    await page.goto('/users/create');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Try to navigate to user edit page
    await page.goto('/users/edit/test-id');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Try to navigate to user detail page
    await page.goto('/users/detail/test-id');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('E-005: Cannot Access Customer Detail Pages', async ({ page }) => {
    await loginAsEmployee(page);
    
    // Try to navigate to customer create page
    await page.goto('/customers/create');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Try to navigate to customer edit page
    await page.goto('/customers/edit/test-id');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Try to navigate to customer detail page
    await page.goto('/customers/detail/test-id');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

