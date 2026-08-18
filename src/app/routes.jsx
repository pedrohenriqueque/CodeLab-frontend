/**
 * Definição de rotas da aplicação CodeLab.
 *
 * Usa createBrowserRouter com lazy loading e ProtectedRoute wrappers.
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';

import Layout from '../shared/components/Layout';
import ProtectedRoute from '../shared/components/ProtectedRoute';

// Auth
import LoginPage from '../features/auth/pages/LoginPage';

// Professor — Atividades
import ActivityListPage from '../features/atividades/pages/ActivityListPage';
import ActivityDetailPage from '../features/atividades/pages/ActivityDetailPage';

// Professor — Submissões
import SubmissionListPage from '../features/submissoes/pages/SubmissionListPage';

// Professor — Dashboard
import DashboardPage from '../features/dashboard/pages/DashboardPage';

// Aluno
import StudentActivityListPage from '../features/atividades/pages/StudentActivityListPage';
import StudentActivityDetailPage from '../features/atividades/pages/StudentActivityDetailPage';
import CodeSubmissionPage from '../features/submissoes/pages/CodeSubmissionPage';
import SandboxPage from '../features/sandbox/pages/SandboxPage';

// Redirect baseado no role do usuário (lê do localStorage para funcionar fora do context)
function HomeRedirect() {
  try {
    const user = JSON.parse(localStorage.getItem('codelab_user') || '{}');
    if (user.tipo === 'professor') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/aluno/atividades" replace />;
  } catch {
    return <Navigate to="/aluno/atividades" replace />;
  }
}

const router = createBrowserRouter([
  // Login (público)
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Rotas protegidas dentro do Layout
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // Home → redirect por role
      {
        index: true,
        element: <HomeRedirect />,
      },

      // ===== PROFESSOR =====
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute allowedRoles={['professor']}>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'atividades',
        element: (
          <ProtectedRoute allowedRoles={['professor']}>
            <ActivityListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'atividades/:uuid',
        element: (
          <ProtectedRoute allowedRoles={['professor']}>
            <ActivityDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'atividades/:uuid/funcao/:funcaoUuid/submissoes',
        element: (
          <ProtectedRoute allowedRoles={['professor']}>
            <SubmissionListPage />
          </ProtectedRoute>
        ),
      },
      // ===== ALUNO =====
      {
        path: 'aluno/atividades',
        element: (
          <ProtectedRoute allowedRoles={['aluno']}>
            <StudentActivityListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'aluno/atividades/:uuid',
        element: (
          <ProtectedRoute allowedRoles={['aluno']}>
            <StudentActivityDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'aluno/atividades/:uuid/funcao/:funcaoUuid/submeter',
        element: (
          <ProtectedRoute allowedRoles={['aluno']}>
            <CodeSubmissionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'aluno/atividades/:uuid/funcao/:funcaoUuid/submissoes',
        element: (
          <ProtectedRoute allowedRoles={['aluno']}>
            <SubmissionListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'aluno/sandbox',
        element: (
          <ProtectedRoute allowedRoles={['aluno']}>
            <SandboxPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
