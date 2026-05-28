import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

// Where to send each role when they hit a route they cannot access.
const defaultHomeFor = (role) => {
  if (role === 'head') return '/head';
  if (role === 'dept_head') return '/manage';
  return '/';
};

const ProtectedRoute = ({ children, role, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const allowed = roles || (role ? [role] : null);
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to={defaultHomeFor(user.role)} replace />;
  }
  return children;
};

export default ProtectedRoute;
