import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';
import { makeApiRequest, expectSuccess } from '../helpers/api';

/**
 * Admin Projects Management Tests
 * Tests: A-101, A-102
 */

test.describe('Admin Projects Management', () => {
  let adminToken: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authContext = await loginAsAdmin(page);
    adminToken = authContext.token;
    await page.close();
  });

  test('A-101: View All Projects', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to Projects page
    await page.goto('/projects');
    
    // Verify page loads
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();
    
    // Verify "New Project" button is visible
    await expect(page.getByRole('button', { name: /new project/i })).toBeVisible();
  });

  test('A-102: Full Project Management', async ({ page, request }) => {
    // Test that admin has full CRUD operations (same as manager)
    
    // Test viewing projects via API
    const getResponse = await makeApiRequest(
      request,
      'get',
      '/projects',
      { token: adminToken }
    );
    
    await expectSuccess(getResponse);
    
    // Test creating project via API
    // First get a customer to use
    const customersResponse = await makeApiRequest(
      request,
      'get',
      '/customers',
      { token: adminToken }
    );
    
    if (customersResponse.ok()) {
      const customersData = await customersResponse.json();
      if (customersData.data && customersData.data.length > 0) {
        const customerId = customersData.data[0].id;
        
        const createResponse = await makeApiRequest(
          request,
          'post',
          '/projects',
          {
            token: adminToken,
            data: {
              name: `Test Project ${Date.now()}`,
              description: 'Test project for admin',
              customer_id: customerId,
              billing_model: 'task-based',
              is_active: true,
            },
          }
        );
        
        await expectSuccess(createResponse);
        
        const projectData = await createResponse.json();
        if (projectData.data && projectData.data.id) {
          const projectId = projectData.data.id;
          
          // Test updating project via API
          const updateResponse = await makeApiRequest(
            request,
            'put',
            `/projects/${projectId}`,
            {
              token: adminToken,
              data: {
                name: `Updated Project ${Date.now()}`,
              },
            }
          );
          
          await expectSuccess(updateResponse);
        }
      }
    }
    
    // Verify UI access
    await loginAsAdmin(page);
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();
    
    // Verify "New Project" button is visible
    await expect(page.getByRole('button', { name: /new project/i })).toBeVisible();
  });
});



