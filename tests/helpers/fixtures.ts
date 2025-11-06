/**
 * Test data fixtures for E2E tests
 */

export const TEST_USERS = {
  employee: {
    email: 'employee1@worklog.com',
    password: 'employee123',
    username: 'employee1@worklog',
    firstName: 'Employee',
    lastName: 'One',
    role: 'employee',
  },
  manager: {
    email: 'manager@worklog.com',
    password: 'manager123',
    username: 'manager@worklog',
    firstName: 'Manager',
    lastName: 'User',
    role: 'manager',
  },
  admin: {
    email: 'admin@worklog.com',
    password: 'admin123',
    username: 'admin@worklog',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  },
} as const;

export const KEYCLOAK_CONFIG = {
  baseUrl: 'http://localhost:8080',
  realm: 'worklog',
  clientId: 'worklog-web',
  adminUsername: 'admin',
  adminPassword: 'admin123',
  redirectUri: 'http://localhost:3000/auth/callback',
} as const;

export const API_CONFIG = {
  baseUrl: 'http://localhost:3001',
  apiPath: '/api/v1',
} as const;

export const WEB_CONFIG = {
  baseUrl: 'http://localhost:3000',
} as const;

export const SAMPLE_DATA = {
  customer: {
    name: 'Test Customer',
    email: 'testcustomer@example.com',
    phone: '555-1234',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    isActive: true,
  },
  project: {
    name: 'Test Project',
    description: 'Test project description',
    customerId: '', // Will be set dynamically
    billingModel: 'task-based' as const,
    isActive: true,
  },
  timeEntry: {
    taskDescription: 'Test task description',
    startTime: '2024-01-15T09:00:00Z',
    endTime: '2024-01-15T17:00:00Z',
  },
  user: {
    email: `testuser${Date.now()}@worklog.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'employee' as const,
  },
} as const;

