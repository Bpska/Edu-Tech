import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardSkeleton } from './Skeleton';

const ProtectedRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated but onboarding not completed, force them to /onboarding (skip for ADMINs)
  if (user && user.role !== 'ADMIN' && user.onboardingCompleted === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If they are on /onboarding but already completed it, redirect to home
  if (user && user.onboardingCompleted === true && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
