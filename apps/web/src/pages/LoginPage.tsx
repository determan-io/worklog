import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const { login } = useAuthStore();

  const handleKeycloakLogin = () => {
    // Redirect to Keycloak login
    const keycloakUrl = `http://localhost:8080/realms/worklog/protocol/openid-connect/auth?client_id=worklog-web&redirect_uri=http://localhost:3000/auth/callback&response_type=code&scope=openid profile email`;
    window.location.href = keycloakUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to WorkLog
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Time tracking made simple
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <button 
              onClick={handleKeycloakLogin}
              className="btn-primary btn-lg w-full"
            >
              Sign in with Keycloak
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
