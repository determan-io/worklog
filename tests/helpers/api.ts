import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { API_CONFIG } from './fixtures';

/**
 * API helper functions for E2E tests
 */

export interface ApiClientOptions {
  baseURL?: string;
  token?: string;
}

/**
 * Helper to make API request with authentication using Playwright's APIRequestContext
 */
export async function makeApiRequest(
  request: APIRequestContext,
  method: 'get' | 'post' | 'put' | 'delete',
  endpoint: string,
  options: {
    token?: string;
    data?: any;
  } = {}
): Promise<APIResponse> {
  const url = `${API_CONFIG.baseUrl}${API_CONFIG.apiPath}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  return request[method](url, {
    headers,
    data: options.data,
  });
}

/**
 * Verify API returns 403 Forbidden
 */
export async function expectForbidden(
  response: APIResponse
): Promise<void> {
  expect(response.status()).toBe(403);
  const body = await response.json();
  expect(body).toHaveProperty('error');
}

/**
 * Verify API returns 401 Unauthorized
 */
export async function expectUnauthorized(
  response: APIResponse
): Promise<void> {
  expect(response.status()).toBe(401);
}

/**
 * Verify API returns success status (200 or 201)
 */
export async function expectSuccess(
  response: APIResponse
): Promise<void> {
  const status = response.status();
  expect([200, 201]).toContain(status);
}


