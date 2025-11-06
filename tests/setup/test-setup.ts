/**
 * Global test setup file for Playwright E2E tests
 * This file runs before all tests to ensure services are running and environment is ready
 */

import { APIRequestContext, request } from '@playwright/test';
import { API_CONFIG, WEB_CONFIG, KEYCLOAK_CONFIG } from '../helpers/fixtures';

/**
 * Check if a service is running by making a request
 */
async function checkService(url: string, timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 401 || response.status === 404; // 401/404 means service is up
  } catch (error) {
    return false;
  }
}

/**
 * Global setup function called before all tests
 */
async function globalSetup() {
  console.log('🔍 Checking test environment...');

  // Check web app
  console.log(`Checking web app at ${WEB_CONFIG.baseUrl}...`);
  const webRunning = await checkService(WEB_CONFIG.baseUrl);
  if (!webRunning) {
    throw new Error(
      `Web app is not running at ${WEB_CONFIG.baseUrl}. Please start it with 'pnpm run dev:web'`
    );
  }
  console.log('✅ Web app is running');

  // Check API
  console.log(`Checking API at ${API_CONFIG.baseUrl}...`);
  const apiRunning = await checkService(`${API_CONFIG.baseUrl}${API_CONFIG.apiPath}/health`);
  if (!apiRunning) {
    // Try without /health endpoint
    const apiRunningAlt = await checkService(API_CONFIG.baseUrl);
    if (!apiRunningAlt) {
      throw new Error(
        `API is not running at ${API_CONFIG.baseUrl}. Please start it with 'pnpm run dev:api'`
      );
    }
  }
  console.log('✅ API is running');

  // Check Keycloak (optional - may not always be accessible in CI)
  console.log(`Checking Keycloak at ${KEYCLOAK_CONFIG.baseUrl}...`);
  const keycloakRunning = await checkService(`${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}`);
  if (!keycloakRunning) {
    console.warn(
      `⚠️  Keycloak may not be running at ${KEYCLOAK_CONFIG.baseUrl}. Authentication tests may fail.`
    );
    console.warn('   Please ensure Keycloak is running with: docker-compose up -d');
  } else {
    console.log('✅ Keycloak is running');
  }

  console.log('✅ Test environment is ready');
}

export default globalSetup;



