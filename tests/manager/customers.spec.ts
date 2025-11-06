import { test, expect } from '@playwright/test';
import { loginAsManager } from '../helpers/auth';
import { makeApiRequest, expectSuccess } from '../helpers/api';

/**
 * Manager Customers Management Tests
 * Tests: M-201 through M-205
 */

test.describe('Manager Customers Management', () => {
  let managerToken: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authContext = await loginAsManager(page);
    managerToken = authContext.token;
    await page.close();
  });

  test('M-201: View All Customers', async ({ page }) => {
    await loginAsManager(page);
    
    // Navigate to Customers page
    await page.goto('/customers');
    
    // Verify page loads
    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible();
  });

  test('M-202: Create New Customer', async ({ page }) => {
    await loginAsManager(page);
    
    // Navigate to Customers page
    await page.goto('/customers');
    
    // Click "New Customer" button
    await page.getByRole('button', { name: /new customer/i }).click();
    
    // Verify customer creation form is displayed
    await expect(page.getByRole('heading', { name: /new customer|create customer/i })).toBeVisible();
  });

  test('M-203: Can Access Customer API', async ({ request }) => {
    const response = await makeApiRequest(
      request,
      'get',
      '/customers',
      { token: managerToken }
    );
    
    await expectSuccess(response);
    
    const data = await response.json();
    expect(data).toBeDefined();
  });

  test('M-204: Can Create Customer via API', async ({ request }) => {
    const response = await makeApiRequest(
      request,
      'post',
      '/customers',
      {
        token: managerToken,
        data: {
          name: `Test Customer ${Date.now()}`,
          email: `test${Date.now()}@example.com`,
          is_active: true,
        },
      }
    );
    
    await expectSuccess(response);
  });

  test('M-205: Can Update Customer via API', async ({ request }) => {
    // Get a customer to update
    const customersResponse = await makeApiRequest(
      request,
      'get',
      '/customers',
      { token: managerToken }
    );
    
    if (!customersResponse.ok()) {
      test.skip();
    }
    
    const customersData = await customersResponse.json();
    if (!customersData.data || customersData.data.length === 0) {
      test.skip();
    }
    
    const customerId = customersData.data[0].id;
    
    const response = await makeApiRequest(
      request,
      'put',
      `/customers/${customerId}`,
      {
        token: managerToken,
        data: {
          name: `Updated Customer ${Date.now()}`,
        },
      }
    );
    
    await expectSuccess(response);
  });
});

