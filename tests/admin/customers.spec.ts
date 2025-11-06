import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';
import { makeApiRequest, expectSuccess } from '../helpers/api';

/**
 * Admin Customers Management Tests
 * Tests: A-201
 */

test.describe('Admin Customers Management', () => {
  let adminToken: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authContext = await loginAsAdmin(page);
    adminToken = authContext.token;
    await page.close();
  });

  test('A-201: Full Customer Management', async ({ page, request }) => {
    // Test that admin has full CRUD operations (same as manager)
    
    // Test viewing customers via API
    const getResponse = await makeApiRequest(
      request,
      'get',
      '/customers',
      { token: adminToken }
    );
    
    await expectSuccess(getResponse);
    
    // Test creating customer via API
    const createResponse = await makeApiRequest(
      request,
      'post',
      '/customers',
      {
        token: adminToken,
        data: {
          name: `Test Customer ${Date.now()}`,
          email: `test${Date.now()}@example.com`,
          is_active: true,
        },
      }
    );
    
    await expectSuccess(createResponse);
    
    const customerData = await createResponse.json();
    if (customerData.data && customerData.data.id) {
      const customerId = customerData.data.id;
      
      // Test updating customer via API
      const updateResponse = await makeApiRequest(
        request,
        'put',
        `/customers/${customerId}`,
        {
          token: adminToken,
          data: {
            name: `Updated Customer ${Date.now()}`,
          },
        }
      );
      
      await expectSuccess(updateResponse);
    }
    
    // Verify UI access
    await loginAsAdmin(page);
    await page.goto('/customers');
    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible();
    
    // Verify "New Customer" button is visible
    await expect(page.getByRole('button', { name: /new customer/i })).toBeVisible();
  });
});



