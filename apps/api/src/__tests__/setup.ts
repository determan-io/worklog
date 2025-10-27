// Jest setup file
// This file runs before all tests

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/worklog_test';
process.env.JWT_SECRET = 'test-secret-key';

// Set test timeout
jest.setTimeout(10000);

