import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loginWithPassword, requestPasswordReset, resetPassword } from '../../services/authService';

// Mock fetch globally
global.fetch = vi.fn();

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loginWithPassword', () => {
    it('should successfully login with valid credentials', async () => {
      const mockToken =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJnaXZlbl9uYW1lIjoiSm9obiIsImZhbWlseV9uYW1lIjoiRG9lIiwicHJlZmVycmVkX3VzZXJuYW1lIjoidGVzdEBleGFtcGxlLmNvbSIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJhZG1pbiIsInVzZXIiXX19.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20i';
      
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: mockToken,
          refresh_token: 'refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      });

      const result = await loginWithPassword('test@example.com', 'password123');

      expect(result.token).toBe(mockToken);
      expect(result.user.id).toBeDefined();
      expect(result.user.email).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/realms/worklog/protocol/openid-connect/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.any(URLSearchParams),
        })
      );
    });

    it('should handle invalid credentials', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Invalid user credentials',
        }),
      });

      await expect(loginWithPassword('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid username or password'
      );
    });

    it('should handle disabled user', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'User is disabled',
        }),
      });

      await expect(loginWithPassword('test@example.com', 'password123')).rejects.toThrow(
        'This account has been disabled'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(loginWithPassword('test@example.com', 'password123')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle missing access token in response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          refresh_token: 'refresh-token',
          expires_in: 3600,
        }),
      });

      await expect(loginWithPassword('test@example.com', 'password123')).rejects.toThrow(
        'No access token received'
      );
    });

    it('should extract user role from token', async () => {
      // Create a proper JWT mock with admin role
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          sub: 'user-1',
          email: 'admin@example.com',
          given_name: 'Admin',
          family_name: 'User',
          realm_access: { roles: ['admin', 'user'] },
        })
      );
      const mockToken = `${header}.${payload}.signature`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: mockToken,
          expires_in: 3600,
        }),
      });

      const result = await loginWithPassword('admin@example.com', 'password123');

      expect(result.user.role).toBe('admin');
      expect(result.user.email).toBe('admin@example.com');
    });

    it('should default to employee role when no role is specified', async () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          sub: 'user-1',
          email: 'user@example.com',
          realm_access: { roles: ['user'] },
        })
      );
      const mockToken = `${header}.${payload}.signature`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: mockToken,
          expires_in: 3600,
        }),
      });

      const result = await loginWithPassword('user@example.com', 'password123');

      expect(result.user.role).toBe('employee');
    });
  });

  describe('requestPasswordReset', () => {
    it('should successfully request password reset', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'OK',
      });

      await expect(requestPasswordReset('test@example.com')).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/login-actions/reset-credentials'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle reset request errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Error',
      });

      await expect(requestPasswordReset('test@example.com')).rejects.toThrow(
        'Failed to send password reset email'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(requestPasswordReset('test@example.com')).rejects.toThrow('Network error');
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'OK',
      });

      await expect(resetPassword('valid-token', 'newpassword123')).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/login-actions/reset-password'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle invalid token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid token',
      });

      await expect(resetPassword('invalid-token', 'newpassword123')).rejects.toThrow(
        'Password reset token is invalid or has expired'
      );
    });

    it('should handle expired token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Token expired',
      });

      await expect(resetPassword('expired-token', 'newpassword123')).rejects.toThrow(
        'Password reset token is invalid or has expired'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(resetPassword('token', 'newpassword123')).rejects.toThrow('Network error');
    });
  });
});


