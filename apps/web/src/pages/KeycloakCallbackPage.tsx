import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function KeycloakCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, setLoading } = useAuthStore();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Keycloak error:', error);
      navigate('/login');
      return;
    }

    if (code) {
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
        .then((response) => response.json())
        .then((data) => {
          if (data.access_token) {
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
            navigate('/dashboard');
          } else {
            console.error('No access token received');
            navigate('/login');
          }
        })
        .catch((error) => {
          console.error('Token exchange error:', error);
          navigate('/login');
        });
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

