/**
 * ProtectedRoute — redireciona para /login se não autenticado.
 *
 * Props:
 *   allowedRoles: ['professor'] | ['aluno'] | undefined (qualquer autenticado)
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuthProvider';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = user?.perfil?.toLowerCase();
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/turmas" replace />;
  }

  return children;
}
