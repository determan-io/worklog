/**
 * Authentication Service
 * Handles authentication with Keycloak using Direct Access Grants (password grant)
 */

const KEYCLOAK_BASE_URL = 'http://localhost:8080/realms/worklog';
const CLIENT_ID = 'worklog-web';

interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

/**
 * Decode JWT token to extract user information
 */
function decodeToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const base64Url = parts[1];
    // Add padding if needed
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Invalid token format');
  }
}

/**
 * Extract user info from JWT token
 */
function extractUserInfo(token: string): UserInfo {
  const payload = decodeToken(token);
  
  // Get role from JWT token - check for specific roles (admin, manager, employee)
  let userRole = 'employee'; // Default role
  const roles = payload.realm_access?.roles || [];
  
  if (roles.includes('admin')) {
    userRole = 'admin';
  } else if (roles.includes('manager')) {
    userRole = 'manager';
  } else if (roles.includes('employee')) {
    userRole = 'employee';
  }
  
  return {
    id: payload.sub,
    email: payload.email || payload.preferred_username,
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
    role: userRole,
  };
}

/**
 * Login with username/email and password using Direct Access Grants
 */
export async function loginWithPassword(
  username: string,
  password: string
): Promise<{ token: string; user: UserInfo }> {
  try {
    const response = await fetch(`${KEYCLOAK_BASE_URL}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        username: username,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error_description || data.error || 'Login failed';
      throw new Error(errorMessage);
    }

    if (!data.access_token) {
      throw new Error('No access token received');
    }

    const user = extractUserInfo(data.access_token);

    return {
      token: data.access_token,
      user,
    };
  } catch (error: any) {
    if (error.message.includes('Invalid user credentials')) {
      throw new Error('Invalid username or password');
    }
    if (error.message.includes('User is disabled')) {
      throw new Error('This account has been disabled');
    }
    throw error;
  }
}

/**
 * Request password reset via Keycloak
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    // Keycloak password reset endpoint
    const response = await fetch(
      `${KEYCLOAK_BASE_URL}/login-actions/reset-credentials?client_id=${CLIENT_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('Failed to send password reset email');
    }

    // Keycloak will redirect or return success, we just need to check if it succeeded
    // In most cases, Keycloak will return 200 even if email doesn't exist (for security)
    return;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to request password reset');
  }
}

/**
 * Reset password with token from Keycloak reset email
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  try {
    // Keycloak password reset confirmation endpoint
    const response = await fetch(
      `${KEYCLOAK_BASE_URL}/login-actions/reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: token,
          password: newPassword,
          'password-confirm': newPassword,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      
      if (errorText.includes('expired') || errorText.includes('invalid')) {
        throw new Error('Password reset token is invalid or has expired');
      }
      
      throw new Error('Failed to reset password');
    }

    return;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to reset password');
  }
}

