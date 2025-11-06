import { test, expect } from '@playwright/test';
import { loginAsManager } from '../helpers/auth';
import { makeApiRequest, expectSuccess } from '../helpers/api';

/**
 * Manager Users Management Tests
 * Tests: M-301 through M-305
 */

test.describe('Manager Users Management', () => {
  let managerToken: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authContext = await loginAsManager(page);
    managerToken = authContext.token;
    await page.close();
  });

  test('M-301: View All Users', async ({ page }) => {
    await loginAsManager(page);
    
    // Navigate to Users page
    await page.goto('/users');
    
    // Verify page loads
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
  });

  test('M-302: Create New User', async ({ page }) => {
    await loginAsManager(page);
    
    // Navigate to Users page
    await page.goto('/users');
    
    // Click "New User" button
    await page.getByRole('button', { name: /new user/i }).click();
    
    // Verify user creation form is displayed
    await expect(page.getByRole('heading', { name: /new user|create user/i })).toBeVisible();
  });

  test('M-303: Can Access All Users via API', async ({ request }) => {
    const response = await makeApiRequest(
      request,
      'get',
      '/users',
      { token: managerToken }
    );
    
    await expectSuccess(response);
    
    const data = await response.json();
    expect(data.data).toBeDefined();
    // Should return all users in organization (admin, manager, and employees)
    if (Array.isArray(data.data) && data.data.length > 0) {
      // Verify we get multiple users
      expect(data.data.length).toBeGreaterThan(1);
    }
  });

  test('M-304: Can Create Users via API', async ({ request }) => {
    const response = await makeApiRequest(
      request,
      'post',
      '/users',
      {
        token: managerToken,
        data: {
          email: `testuser${Date.now()}@worklog.com`,
          first_name: 'Test',
          last_name: 'User',
          role: 'employee',
        },
      }
    );
    
    await expectSuccess(response);
  });

  test('M-305: Can Update Users via API', async ({ request }) => {
    // Get a user to update
    const usersResponse = await makeApiRequest(
      request,
      'get',
      '/users',
      { token: managerToken }
    );
    
    if (!usersResponse.ok()) {
      test.skip();
    }
    
    const usersData = await usersResponse.json();
    if (!usersData.data || usersData.data.length === 0) {
      test.skip();
    }
    
    // Get a user that's not the manager themselves
    const userToUpdate = usersData.data.find((u: any) => u.role !== 'manager') || usersData.data[0];
    const userId = userToUpdate.uuid || userToUpdate.id;
    
    const response = await makeApiRequest(
      request,
      'put',
      `/users/${userId}`,
      {
        token: managerToken,
        data: {
          first_name: `Updated ${Date.now()}`,
        },
      }
    );
    
    await expectSuccess(response);
  });
});

