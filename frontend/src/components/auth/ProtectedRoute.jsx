import { Navigate, useLocation } from 'react-router-dom';
import { TOKEN_KEY } from '../../utils/constants';

/**
 * Protected Route Component
 * Checks authentication and redirects to login if not authenticated
 * Optimized to avoid unnecessary re-renders
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

