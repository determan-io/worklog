import { test, expect } from '@playwright/test';
import { loginAsEmployee } from '../helpers/auth';
import { makeApiRequest, expectForbidden } from '../helpers/api';

/**
 * Employee Customers Access Tests
 * Tests: E-201 through E-205
 */

test.describe('Employee Customers Access', () => {
  let employeeToken: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authContext = await loginAsEmployee(page);
    employeeToken = authContext.token;
    await page.close();
  });

  test('E-201: Cannot View Customers via UI', async ({ page }) => {
    await loginAsEmployee(page);
    
    // Try to navigate to Customers page
    await page.goto('/customers');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('E-202: Cannot View Customers via API', async ({ request }) => {
    const response = await makeApiRequest(
      request,
      'get',
      '/customers',
      { token: employeeToken }
    );
    
    await expectForbidden(response);
  });

  test('E-203: Cannot View Customer Details via API', async ({ request }) => {
    const response = await makeApiRequest(
      request,
      'get',
      '/customers/1',
      { token: employeeToken }
    );
    
    await expectForbidden(response);
  });

  test('E-204: Cannot Create Customer via API', async ({ request }) => {
    const response = await makeApiRequest(
      request,
      'post',
      '/customers',
      {
        token: employeeToken,
        data: {
          name: 'Test Customer',
          email: 'test@example.com',
          is_active: true,
        },
      }
    );
    
    await expectForbidden(response);
  });

  test('E-205: Cannot Update Customer via API', async ({ request }) => {
    const response = await makeApiRequest(
      request,
      'put',
      '/customers/1',
      {
        token: employeeToken,
        data: {
          name: 'Updated Customer Name',
        },
      }
    );
    
    await expectForbidden(response);
  });
});

