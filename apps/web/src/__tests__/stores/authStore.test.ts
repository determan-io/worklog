import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../stores/authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it('should initialize with no user', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set user and token on login', () => {
    const mockUser = {
      id: '1',
      uuid: 'test-uuid',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'employee',
      organizationId: 'org-1',
    };

    useAuthStore.getState().login('mock-token', mockUser);
    
    const state = useAuthStore.getState();
    expect(state.token).toBe('mock-token');
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should clear user and token on logout', () => {
    // First login
    const mockUser = {
      id: '1',
      uuid: 'test-uuid',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'employee',
      organizationId: 'org-1',
    };

    useAuthStore.getState().login('mock-token', mockUser);
    
    // Then logout
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should update user data', () => {
    const mockUser = {
      id: '1',
      uuid: 'test-uuid',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'employee',
      organizationId: 'org-1',
    };

    useAuthStore.getState().login('mock-token', mockUser);
    
    const updatedUser = { ...mockUser, firstName: 'Jane' };
    useAuthStore.getState().updateUser(updatedUser);
    
    const state = useAuthStore.getState();
    expect(state.user?.firstName).toBe('Jane');
  });
});

