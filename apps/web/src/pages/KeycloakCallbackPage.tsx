import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function KeycloakCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const processedRef = useRef(false);

  useEffect(() => {
    // Check if we just logged out - if so, ignore any codes and go to login
    const logoutFlag = sessionStorage.getItem('logout-flag');
    if (logoutFlag) {
      sessionStorage.removeItem('logout-flag');
      navigate('/login?logout=true', { replace: true });
      return;
    }

    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Prevent processing the same callback twice
    if (processedRef.current) {
      return;
    }

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Keycloak error:', error);
      alert(`Authentication error: ${error}. Please try again.`);
      navigate('/login', { replace: true });
      return;
    }

    if (!code) {
      console.error('No authorization code received');
      navigate('/login', { replace: true });
      return;
    }

    // Mark as processing to prevent duplicate requests
    processedRef.current = true;

    // Exchange code for token
    fetch('http://localhost:8080/realms/worklog/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: 'worklog-web',
        redirect_uri: 'http://localhost:3000/auth/callback',
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Token exchange failed:', data);
          throw new Error(data.error_description || data.error || 'Token exchange failed');
        }

        if (!data.access_token) {
          throw new Error('No access token in response');
        }

        // Store token and get user info
        localStorage.setItem('auth-token', data.access_token);
        
        // Decode JWT token to get user info (simple version, should use proper JWT library)
        const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
        
        // Get role from JWT token - check for specific roles (admin, manager, employee)
        let userRole = 'employee'; // Default role
        const roles = tokenPayload.realm_access?.roles || [];
        
        if (roles.includes('admin')) {
          userRole = 'admin';
        } else if (roles.includes('manager')) {
          userRole = 'manager';
        } else if (roles.includes('employee')) {
          userRole = 'employee';
        }
        
        // Login with token
        login(data.access_token, {
          id: tokenPayload.sub,
          email: tokenPayload.email || tokenPayload.preferred_username,
          firstName: tokenPayload.given_name || '',
          lastName: tokenPayload.family_name || '',
          role: userRole,
          organizationId: '', // Will be set by API on first request
        });
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      })
      .catch((error) => {
        console.error('Token exchange error:', error);
        alert(`Authentication failed: ${error.message}. Please try logging in again.`);
        navigate('/login', { replace: true });
        processedRef.current = false; // Allow retry
      });
  }, [searchParams, navigate, login, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

