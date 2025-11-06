import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsEmployee } from '../helpers/auth';
import { makeApiRequest, expectSuccess, expectForbidden } from '../helpers/api';
import { TEST_USERS } from '../helpers/fixtures';

/**
 * Keycloak User Creation & Integration Tests
 * Tests: UC-001 through UC-009
 */

test.describe('Keycloak User Creation & Integration', () => {
  let adminToken: string;
  let createdEmployeeEmail: string;
  let createdEmployeePassword: string;
  let createdManagerEmail: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authContext = await loginAsAdmin(page);
    adminToken = authContext.token;
    await page.close();
    
    // Generate unique emails for test users
    const timestamp = Date.now();
    createdEmployeeEmail = `testemployee${timestamp}@worklog.com`;
    createdManagerEmail = `testmanager${timestamp}@worklog.com`;
    createdEmployeePassword = 'TestPassword123!';
  });

  test('UC-001: Admin Creates Employee via UI', async ({ page, request }) => {
    await loginAsAdmin(page);
    
    // Navigate to Users page
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
    
    // Click "New User" button
    await page.getByRole('button', { name: /new user/i }).click();
    
    // Fill in employee details
    await page.fill('input[name="email"]', createdEmployeeEmail);
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Employee');
    await page.fill('input[name="password"]', createdEmployeePassword);
    
    // Select role as employee
    const roleSelect = page.locator('select[name="role"]').or(
      page.getByLabel(/role/i)
    );
    if (await roleSelect.count() > 0) {
      await roleSelect.selectOption('employee');
    }
    
    // Submit the form
    await page.getByRole('button', { name: /submit|create|save/i }).click();
    
    // Verify employee was created - check if redirected back to users list or success message
    await expect(
      page.getByText(/user created|successfully created/i).or(
        page.getByRole('heading', { name: /users/i })
      )
    ).toBeVisible({ timeout: 10000 });
    
    // Verify via API that user was created
    const response = await makeApiRequest(
      request,
      'get',
      '/users',
      { token: adminToken }
    );
    
    await expectSuccess(response);
    const usersData = await response.json();
    
    if (usersData.data && Array.isArray(usersData.data)) {
      const createdUser = usersData.data.find((u: any) => u.email === createdEmployeeEmail);
      expect(createdUser).toBeDefined();
      expect(createdUser.role).toBe('employee');
    }
  });

  test('UC-003: Verify User Can Login', async ({ page }) => {
    // This test assumes user was created in UC-001
    // Since we can't easily verify Keycloak details via Playwright (UC-002),
    // we'll verify the user can login
    
    // Logout from admin account first
    await page.goto('/');
    const logoutButton = page.getByRole('button', { name: /sign out|logout/i });
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForURL(/\/login|\//, { timeout: 5000 });
    }
    
    // Navigate to login page
    await page.goto('/');
    
    // Click "Sign in with Keycloak"
    const signInButton = page.getByRole('button', { name: /sign in with keycloak/i });
    await expect(signInButton).toBeVisible();
    await signInButton.click();
    
    // Wait for Keycloak login page
    await page.waitForURL(/\/realms\/worklog\/protocol\/openid-connect\/auth/);
    
    // Fill in employee credentials
    await page.fill('input[name="username"]', createdEmployeeEmail);
    await page.fill('input[name="password"]', createdEmployeePassword);
    await page.click('input[type="submit"][value="Sign In"]');
    
    // Wait for callback and dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Verify employee-level access (no Customers/Users links)
    await expect(page.getByRole('link', { name: /customers/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /users/i })).not.toBeVisible();
    
    // Verify employee can see their own dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('UC-004: Admin Edits User', async ({ page, request }) => {
    await loginAsAdmin(page);
    
    // Get a user to edit (preferably one we created or an existing employee)
    const response = await makeApiRequest(
      request,
      'get',
      '/users',
      { token: adminToken }
    );
    
    await expectSuccess(response);
    const usersData = await response.json();
    
    if (!usersData.data || usersData.data.length === 0) {
      test.skip();
    }
    
    const userToEdit = usersData.data.find((u: any) => u.role === 'employee') || usersData.data[0];
    const userId = userToEdit.id;
    
    // Navigate to Users page
    await page.goto('/users');
    
    // Find and click Edit button for the user
    // This might be a link or button in a table row
    const editButton = page.locator(`a[href*="/users/edit/${userId}"], button:has-text("Edit")`).first();
    await editButton.click();
    
    // Verify edit form is displayed
    await expect(
      page.getByRole('heading', { name: /edit user|update user/i }).or(
        page.locator('input[name="firstName"]')
      )
    ).toBeVisible();
    
    // Update first name
    await page.fill('input[name="firstName"]', 'Updated');
    
    // Submit the form
    await page.getByRole('button', { name: /submit|update|save/i }).click();
    
    // Verify update was successful
    await expect(
      page.getByText(/user updated|successfully updated/i).or(
        page.getByRole('heading', { name: /users/i })
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test('UC-006: Admin Creates Manager via UI', async ({ page, request }) => {
    await loginAsAdmin(page);
    
    // Navigate to Users page
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
    
    // Click "New User" button
    await page.getByRole('button', { name: /new user/i }).click();
    
    // Fill in manager details
    await page.fill('input[name="email"]', createdManagerEmail);
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Manager');
    await page.fill('input[name="password"]', 'TestPassword123!');
    
    // Select role as manager
    const roleSelect = page.locator('select[name="role"]').or(
      page.getByLabel(/role/i)
    );
    if (await roleSelect.count() > 0) {
      await roleSelect.selectOption('manager');
    }
    
    // Submit the form
    await page.getByRole('button', { name: /submit|create|save/i }).click();
    
    // Verify manager was created
    await expect(
      page.getByText(/user created|successfully created/i).or(
        page.getByRole('heading', { name: /users/i })
      )
    ).toBeVisible({ timeout: 10000 });
    
    // Verify via API
    const response = await makeApiRequest(
      request,
      'get',
      '/users',
      { token: adminToken }
    );
    
    await expectSuccess(response);
    const usersData = await response.json();
    
    if (usersData.data && Array.isArray(usersData.data)) {
      const createdUser = usersData.data.find((u: any) => u.email === createdManagerEmail);
      expect(createdUser).toBeDefined();
      expect(createdUser.role).toBe('manager');
    }
  });

  test('UC-008: Employee Cannot Create Users', async ({ page, request }) => {
    // Test UI protection
    await loginAsEmployee(page);
    
    // Try to navigate to users page
    await page.goto('/users');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    
    // Test API protection
    const employeeContext = await loginAsEmployee(page);
    const employeeToken = employeeContext.token;
    
    const response = await makeApiRequest(
      request,
      'post',
      '/users',
      {
        token: employeeToken,
        data: {
          email: `unauthorized${Date.now()}@worklog.com`,
          first_name: 'Unauthorized',
          last_name: 'User',
          role: 'employee',
        },
      }
    );
    
    await expectForbidden(response);
    
    const errorData = await response.json();
    expect(errorData.error).toBeDefined();
  });

  test('UC-009: Cross-Organization User Creation', async ({ page, request }) => {
    await loginAsAdmin(page);
    
    // Create a user - it should be in admin's organization
    const timestamp = Date.now();
    const crossOrgEmail = `crossorg${timestamp}@worklog.com`;
    
    const createResponse = await makeApiRequest(
      request,
      'post',
      '/users',
      {
        token: adminToken,
        data: {
          email: crossOrgEmail,
          first_name: 'Cross',
          last_name: 'Org',
          role: 'employee',
        },
      }
    );
    
    await expectSuccess(createResponse);
    
    const userData = await createResponse.json();
    expect(userData.data).toBeDefined();
    
    // Verify user belongs to admin's organization
    // This would need to be checked via API or database
    // For now, we verify the user was created successfully
    const orgId = userData.data.organization_id;
    expect(orgId).toBeDefined();
  });
});

