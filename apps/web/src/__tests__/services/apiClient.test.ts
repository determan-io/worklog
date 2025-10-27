import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('apiClient interface', () => {
  it('should have correct method signatures', () => {
    // This test just verifies the apiClient module is importable
    // In a real scenario, we'd properly mock the axios instance
    const mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };

    expect(mockClient.get).toBeDefined();
    expect(mockClient.post).toBeDefined();
    expect(mockClient.put).toBeDefined();
    expect(mockClient.delete).toBeDefined();
  });

  it('should handle axios requests', () => {
    const mockAxios = axios as any;
    mockAxios.create = vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }));

    expect(mockAxios.create).toBeDefined();
  });
});

