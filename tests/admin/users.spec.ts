import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';
import { makeApiRequest, expectSuccess } from '../helpers/api';

/**
 * Admin Users Management Tests
 * Tests: A-301
 */

test.describe('Admin Users Management', () => {
  let adminToken: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authContext = await loginAsAdmin(page);
    adminToken = authContext.token;
    await page.close();
  });

  test('A-301: Full User Management', async ({ page, request }) => {
    // Test that admin has full CRUD operations (same as manager)
    
    // Test viewing users via API
    const getResponse = await makeApiRequest(
      request,
      'get',
      '/users',
      { token: adminToken }
    );
    
    await expectSuccess(getResponse);
    
    const usersData = await getResponse.json();
    expect(usersData.data).toBeDefined();
    // Should return all users in organization (admin, manager, and employees)
    if (Array.isArray(usersData.data) && usersData.data.length > 0) {
      // Verify we get multiple users
      expect(usersData.data.length).toBeGreaterThan(1);
    }
    
    // Test creating user via API
    const createResponse = await makeApiRequest(
      request,
      'post',
      '/users',
      {
        token: adminToken,
        data: {
          email: `testuser${Date.now()}@worklog.com`,
          first_name: 'Test',
          last_name: 'User',
          role: 'employee',
        },
      }
    );
    
    await expectSuccess(createResponse);
    
    const userData = await createResponse.json();
    if (userData.data && userData.data.id) {
      const userId = userData.data.id;
      
      // Test updating user via API
      const updateResponse = await makeApiRequest(
        request,
        'put',
        `/users/${userId}`,
        {
          token: adminToken,
          data: {
            first_name: 'Updated',
          },
        }
      );
      
      await expectSuccess(updateResponse);
    }
    
    // Verify UI access
    await loginAsAdmin(page);
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
    
    // Verify "New User" button is visible
    await expect(page.getByRole('button', { name: /new user/i })).toBeVisible();
  });
});



