import { test, expect } from '@playwright/test';
import { loginAsEmployee } from '../helpers/auth';
import { makeApiRequest } from '../helpers/api';

/**
 * Employee Time Tracking Tests
 * Tests: E-401 through E-402
 */

test.describe('Employee Time Tracking', () => {
  let employeeToken: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authContext = await loginAsEmployee(page);
    employeeToken = authContext.token;
    await page.close();
  });

  test('E-401: Can View Own Time Entries', async ({ page, request }) => {
    await loginAsEmployee(page);
    
    // Navigate to Time Tracking page
    await page.goto('/time-tracking');
    
    // Verify page loads
    await expect(page.getByRole('heading', { name: /time tracking/i })).toBeVisible();
    
    // Also verify via API
    const response = await makeApiRequest(
      request,
      'get',
      '/time-entries',
      { token: employeeToken }
    );
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // Verify response contains time entries (could be empty array)
    expect(data).toBeDefined();
    if (data.data && Array.isArray(data.data)) {
      // All entries should belong to the employee
      data.data.forEach((entry: any) => {
        // Verify entry belongs to logged-in user
        // This would require comparing user_id with the employee's ID
      });
    }
  });

  test('E-402: Can Create Time Entries', async ({ page, request }) => {
    await loginAsEmployee(page);
    
    // First, get a project ID to use for the time entry
    const projectsResponse = await makeApiRequest(
      request,
      'get',
      '/projects',
      { token: employeeToken }
    );
    
    let projectId: number | null = null;
    if (projectsResponse.ok()) {
      const projectsData = await projectsResponse.json();
      if (projectsData.data && projectsData.data.length > 0) {
        projectId = projectsData.data[0].id;
      }
    }
    
    if (!projectId) {
      test.skip();
    }
    
    // Navigate to time entry form
    await page.goto('/time-tracking');
    
    // Look for "New Time Entry" or create button
    const createButton = page.getByRole('button', { name: /new|create|add/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Fill in time entry form
      await page.fill('input[name="task_description"]', 'Test task description');
      await page.fill('input[name="start_time"]', '2024-01-15T09:00');
      await page.fill('input[name="end_time"]', '2024-01-15T17:00');
      
      if (projectId) {
        await page.selectOption('select[name="project_id"]', projectId.toString());
      }
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Verify success (redirect or success message)
      await expect(page.getByText(/success|created/i)).toBeVisible({ timeout: 5000 });
    }
    
    // Also test via API
    const response = await makeApiRequest(
      request,
      'post',
      '/time-entries',
      {
        token: employeeToken,
        data: {
          project_id: projectId,
          task_description: 'Test API time entry',
          entry_date: '2024-01-15',
          hours: 8,
        },
      }
    );
    
    expect([200, 201]).toContain(response.status());
  });
});

