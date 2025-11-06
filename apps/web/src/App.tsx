import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import KeycloakCallbackPage from './pages/KeycloakCallbackPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import TimeTrackingPage from './pages/TimeTrackingPage';
import ProjectsPage from './pages/ProjectsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerFormPage from './pages/CustomerFormPage';
import ProjectFormPage from './pages/ProjectFormPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TimeEntryFormPage from './pages/TimeEntryFormPage';
import TimeEntryDetailPage from './pages/TimeEntryDetailPage';
import UsersPage from './pages/UsersPage';
import UserDetailPage from './pages/UserDetailPage';
import UserFormPage from './pages/UserFormPage';
import AddUserToProjectPage from './pages/AddUserToProjectPage';
import AddProjectToUserPage from './pages/AddProjectToUserPage';
import EditMembershipPage from './pages/EditMembershipPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isAuthenticated, isLoading, user, token, logout } = useAuthStore();
  const location = useLocation();

  // If logout parameter is in URL, clear auth state
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('logout') === 'true') {
      logout();
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-storage');
      // Force clear persisted state
      try {
        localStorage.setItem('auth-storage', JSON.stringify({
          state: {
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          },
          version: 0,
        }));
      } catch (e) {
        // Ignore errors
      }
    }
  }, [location.search, logout]);

  // Sync token from auth store to localStorage for API client
  useEffect(() => {
    if (token && !localStorage.getItem('auth-token')) {
      localStorage.setItem('auth-token', token);
    }
  }, [token]);

  // Debug logging
  console.log('App render:', { isAuthenticated, isLoading, user });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading WorkLog...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/auth/callback" element={<KeycloakCallbackPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth/callback" element={<KeycloakCallbackPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/time-tracking" element={<TimeTrackingPage />} />
        <Route path="/time-tracking/add" element={<TimeEntryFormPage />} />
        <Route path="/time-tracking/weekly" element={<TimeEntryFormPage />} />
        <Route path="/time-tracking/edit/:id" element={<TimeEntryFormPage />} />
        <Route path="/time-entries/:id" element={<TimeEntryDetailPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/detail/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/create" element={<ProjectFormPage />} />
        <Route path="/projects/edit/:id" element={<ProjectFormPage />} />
        <Route path="/projects/:projectId/add-user" element={<AddUserToProjectPage />} />
        <Route path="/projects/:projectId/edit-membership/:membershipId" element={<EditMembershipPage />} />
        <Route path="/customers" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><CustomersPage /></ProtectedRoute>} />
        <Route path="/customers/detail/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><CustomerDetailPage /></ProtectedRoute>} />
        <Route path="/customers/create" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><CustomerFormPage /></ProtectedRoute>} />
        <Route path="/customers/edit/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><CustomerFormPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><UsersPage /></ProtectedRoute>} />
        <Route path="/users/detail/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><UserDetailPage /></ProtectedRoute>} />
        <Route path="/users/create" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><UserFormPage /></ProtectedRoute>} />
        <Route path="/users/edit/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><UserFormPage /></ProtectedRoute>} />
        <Route path="/users/:userId/add-project" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AddProjectToUserPage /></ProtectedRoute>} />
        <Route path="/users/:userId/edit-membership/:membershipId" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><EditMembershipPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
