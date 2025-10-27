import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuthStore();

  // If no allowed roles specified, allow all authenticated users
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required role
  if (!user || !allowedRoles.includes(user.role)) {
    console.log('🚫 Access denied - redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

