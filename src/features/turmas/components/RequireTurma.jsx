import { Navigate } from 'react-router-dom';
import LoadingScreen from '../../../shared/components/LoadingScreen';
import { useTurmaContext } from '../context/TurmaContext';

export default function RequireTurma({ children }) {
  const { turmaAtiva, loadingTurmas } = useTurmaContext();
  if (loadingTurmas) return <LoadingScreen />;
  if (!turmaAtiva) return <Navigate to="/turmas" replace />;
  return children;
}
