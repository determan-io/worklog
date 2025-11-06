import { test, expect } from '@playwright/test';
import { loginAsEmployee } from '../helpers/auth';
import { makeApiRequest, expectForbidden } from '../helpers/api';

/**
 * Employee Users Access Tests
 * Tests: E-301 through E-307
 */

test.describe('Employee Users Access', () => {
  let employeeToken: string;
  let employeeUserId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authContext = await loginAsEmployee(page);
    employeeToken = authContext.token;
    
    // Get the user ID from the token or API
    // For now, we'll extract it from the JWT or make an API call
    const userResponse = await makeApiRequest(
      context.request as any,
      'get',
      '/users',
      { token: employeeToken }
    );
    
    if (userResponse.ok()) {
      const userData = await userResponse.json();
      if (userData.data && userData.data.length > 0) {
        employeeUserId = userData.data[0].uuid || userData.data[0].id;
      }
    }
    
    await page.close();
  });

  test('E-301: Cannot View Users List via UI', async ({ page }) => {
    await loginAsEmployee(page);
    
    // Try to navigate to Users page
    await page.goto('/users');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('E-302: Cannot View All Users via API', async ({ request }) => {
    const response = await makeApiRequest(
      request,
      'get',
      '/users',
      { token: employeeToken }
    );
    
    // Should return only their own user record, not 403
    expect(response.status()).toBe(200);
    const data = await response.json();
    // Verify only one user is returned (themselves)
    expect(data.data).toBeDefined();
    if (Array.isArray(data.data)) {
      expect(data.data.length).toBeLessThanOrEqual(1);
    }
  });

  test('E-303: Cannot View Other Users via API', async ({ request }) => {
    // Try to access another user (using a UUID that's not the employee's)
    const response = await makeApiRequest(
      request,
      'get',
      '/users/00000000-0000-0000-0000-000000000000',
      { token: employeeToken }
    );
    
    // Should return 403 or 404
    expect([403, 404]).toContain(response.status());
  });

  test('E-304: Cannot Create Users via API', async ({ request }) => {
    const response = await makeApiRequest(
      request,
      'post',
      '/users',
      {
        token: employeeToken,
        data: {
          email: 'newuser@worklog.com',
          first_name: 'New',
          last_name: 'User',
          role: 'employee',
        },
      }
    );
    
    await expectForbidden(response);
    
    // Verify error message
    const errorData = await response.json();
    expect(errorData.error).toBeDefined();
    expect(errorData.error.message).toContain('administrators and managers');
  });

  test('E-305: Can Update Own Profile', async ({ request }) => {
    if (!employeeUserId) {
      test.skip();
    }
    
    const response = await makeApiRequest(
      request,
      'put',
      `/users/${employeeUserId}`,
      {
        token: employeeToken,
        data: {
          first_name: 'Updated',
        },
      }
    );
    
    // Should allow update (200 or 201)
    expect([200, 201]).toContain(response.status());
  });

  test('E-306: Cannot Change Own Role', async ({ request }) => {
    if (!employeeUserId) {
      test.skip();
    }
    
    const response = await makeApiRequest(
      request,
      'put',
      `/users/${employeeUserId}`,
      {
        token: employeeToken,
        data: {
          role: 'admin',
        },
      }
    );
    
    // Should return 403
    await expectForbidden(response);
  });

  test('E-307: Cannot Update Other Users', async ({ request }) => {
    // Try to update another user (using a UUID that's not the employee's)
    const response = await makeApiRequest(
      request,
      'put',
      '/users/00000000-0000-0000-0000-000000000000',
      {
        token: employeeToken,
        data: {
          first_name: 'Hacked',
        },
      }
    );
    
    await expectForbidden(response);
  });
});

