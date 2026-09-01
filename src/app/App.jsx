/**
 * App — ponto de entrada React.
 *
 * Configura ThemeProvider, CssBaseline, AuthProvider, SnackbarProvider e Router.
 * Usa BrowserRouter + Routes para que ProtectedRoute tenha acesso ao AuthContext.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomThemeProvider } from '../shared/theme/ThemeContext';
import { AuthProvider, useAuth } from '../features/auth/hooks/useAuthProvider';
import { SnackbarProvider } from '../shared/hooks/useSnackbar';
import Layout from '../shared/components/Layout';
import ProtectedRoute from '../shared/components/ProtectedRoute';

// Auth & Public
import LoginPage from '../features/auth/pages/LoginPage';
import LandingPage from '../features/landing/pages/LandingPage';

// Professor
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import ActivityListPage from '../features/atividades/pages/ActivityListPage';
import ActivityDetailPage from '../features/atividades/pages/ActivityDetailPage';
import CreateActivityWizard from '../features/atividades/pages/CreateActivityWizard';
import SubmissionListPage from '../features/submissoes/pages/SubmissionListPage';
import AlunosPage from '../features/dashboard/pages/AlunosPage';
import ResultadosPage from '../features/dashboard/pages/ResultadosPage';
import ConfiguracoesPage from '../features/dashboard/pages/ConfiguracoesPage';

// Aluno
import SandboxPage from '../features/sandbox/pages/SandboxPage';
import StudentActivityListPage from '../features/atividades/pages/StudentActivityListPage';
import StudentActivityDetailPage from '../features/atividades/pages/StudentActivityDetailPage';
import CodeSubmissionPage from '../features/submissoes/pages/CodeSubmissionPage';

function HomeRedirect() {
  const { user, isProfessor } = useAuth();
  if (!user) return <LandingPage />;
  if (isProfessor) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/aluno/atividades" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Tela Inicial Pública */}
      <Route path="/" element={<LandingPage />} />

      {/* Login público */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas protegidas com Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Rota autenticada base /app ou redirect */}
        <Route path="app" element={<HomeRedirect />} />

        {/* ===== PROFESSOR ===== */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="atividades/criar"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <CreateActivityWizard />
            </ProtectedRoute>
          }
        />
        <Route
          path="atividades"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <ActivityListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="atividades/:uuid"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <ActivityDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="atividades/:uuid/funcao/:funcaoUuid/submissoes"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <SubmissionListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="submissoes"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <SubmissionListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="alunos"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <AlunosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="resultados"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <ResultadosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="configuracoes"
          element={
            <ProtectedRoute>
              <ConfiguracoesPage />
            </ProtectedRoute>
          }
        />

        {/* ===== ALUNO ===== */}
        <Route
          path="aluno/sandbox"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <SandboxPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="aluno/atividades"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <StudentActivityListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="aluno/atividades/:uuid"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <StudentActivityDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="aluno/atividades/:uuid/funcao/:funcaoUuid/submeter"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <CodeSubmissionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="aluno/atividades/:uuid/funcao/:funcaoUuid/submissoes"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <SubmissionListPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <SnackbarProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SnackbarProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}
