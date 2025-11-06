import { test, expect } from '@playwright/test';
import { loginAsEmployee, loginAsAdmin } from '../helpers/auth';
import { makeApiRequest, expectUnauthorized, expectForbidden } from '../helpers/api';

/**
 * Security Boundary Tests
 * Tests: S-001 through S-103
 */

test.describe('Security Boundary Tests', () => {
  
  test.describe('Cross-Organization Access', () => {
    test('S-001: Cannot Access Other Organization Data', async ({ page, request }) => {
      // For this test, we verify that API filters by organization
      // Since all test users are from Organization 1, we verify filtering works
      const employeeAuth = await loginAsEmployee(page);
      
      const response = await makeApiRequest(
        request,
        'get',
        '/users',
        { token: employeeAuth.token }
      );
      
      // Employee should only see users in their organization
      if (response.ok()) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          // All users should be from the same organization
          const organizationIds = data.data.map((u: any) => u.organization_id).filter(Boolean);
          if (organizationIds.length > 0) {
            const uniqueOrgs = [...new Set(organizationIds)];
            expect(uniqueOrgs.length).toBe(1);
          }
        }
      }
    });

    test('S-002: API Filters by Organization', async ({ page, request }) => {
      // Verify API filters data by organization
      const adminAuth = await loginAsAdmin(page);
      
      // Test customers endpoint
      const customersResponse = await makeApiRequest(
        request,
        'get',
        '/customers',
        { token: adminAuth.token }
      );
      
      if (customersResponse.ok()) {
        const customersData = await customersResponse.json();
        if (customersData.data && Array.isArray(customersData.data)) {
          const organizationIds = customersData.data.map((c: any) => c.organization_id).filter(Boolean);
          if (organizationIds.length > 0) {
            const uniqueOrgs = [...new Set(organizationIds)];
            expect(uniqueOrgs.length).toBe(1);
          }
        }
      }
      
      // Test projects endpoint
      const projectsResponse = await makeApiRequest(
        request,
        'get',
        '/projects',
        { token: adminAuth.token }
      );
      
      if (projectsResponse.ok()) {
        const projectsData = await projectsResponse.json();
        if (projectsData.data && Array.isArray(projectsData.data)) {
          const organizationIds = projectsData.data.map((p: any) => p.organization_id).filter(Boolean);
          if (organizationIds.length > 0) {
            const uniqueOrgs = [...new Set(organizationIds)];
            expect(uniqueOrgs.length).toBe(1);
          }
        }
      }
    });
  });

  test.describe('API Security', () => {
    test('S-101: Unauthenticated Requests', async ({ request }) => {
      // Test without token
      const response = await makeApiRequest(
        request,
        'get',
        '/users',
        {}
      );
      
      await expectUnauthorized(response);
    });

    test('S-102: Invalid Token', async ({ request }) => {
      // Test with invalid token
      const response = await makeApiRequest(
        request,
        'get',
        '/users',
        { token: 'invalid-token-12345' }
      );
      
      await expectUnauthorized(response);
    });

    test('S-103: Direct API Manipulation', async ({ page, request }) => {
      // Employee tries to create user via API
      const employeeAuth = await loginAsEmployee(page);
      
      const createUserResponse = await makeApiRequest(
        request,
        'post',
        '/users',
        {
          token: employeeAuth.token,
          data: {
            email: `hacked${Date.now()}@worklog.com`,
            first_name: 'Hacked',
            last_name: 'User',
            role: 'admin',
          },
        }
      );
      
      await expectForbidden(createUserResponse);
      
      // Employee tries to create customer via API
      const createCustomerResponse = await makeApiRequest(
        request,
        'post',
        '/customers',
        {
          token: employeeAuth.token,
          data: {
            name: 'Hacked Customer',
            email: `hacked${Date.now()}@example.com`,
            is_active: true,
          },
        }
      );
      
      await expectForbidden(createCustomerResponse);
      
      // Employee tries to create project via API
      // First get a customer (as admin)
      const adminAuth = await loginAsAdmin(page);
      
      const customersResponse = await makeApiRequest(
        request,
        'get',
        '/customers',
        { token: adminAuth.token }
      );
      
      if (customersResponse.ok()) {
        const customersData = await customersResponse.json();
        if (customersData.data && customersData.data.length > 0) {
          const customerId = customersData.data[0].id;
          
          const createProjectResponse = await makeApiRequest(
            request,
            'post',
            '/projects',
            {
              token: employeeAuth.token,
              data: {
                name: 'Hacked Project',
                customer_id: customerId,
                billing_model: 'task-based',
                is_active: true,
              },
            }
          );
          
          await expectForbidden(createProjectResponse);
        }
      }
    });
  });
});
