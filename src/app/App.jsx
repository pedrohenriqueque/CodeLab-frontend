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
import AdminTeachersPage from '../features/auth/pages/AdminTeachersPage';
import LandingPage from '../features/landing/pages/LandingPage';

// Professor
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import ActivityListPage from '../features/atividades/pages/ActivityListPage';
import ActivityDetailPage from '../features/atividades/pages/ActivityDetailPage';
import CreateActivityWizard from '../features/atividades/pages/CreateActivityWizard';
import FunctionLibraryPage from '../features/funcoes/pages/FunctionLibraryPage';
import MinhasTurmasPage from '../features/turmas/pages/MinhasTurmasPage';
import { TurmaProvider } from '../features/turmas/context/TurmaContext';
import RequireTurma from '../features/turmas/components/RequireTurma';
import SubmissionListPage from '../features/submissoes/pages/SubmissionListPage';
import ProfessorSubmissionDetailPage from '../features/submissoes/pages/ProfessorSubmissionDetailPage';
import AlunosPage from '../features/dashboard/pages/AlunosPage';
import ResultadosPage from '../features/dashboard/pages/ResultadosPage';
import ConfiguracoesPage from '../features/dashboard/pages/ConfiguracoesPage';

// Aluno
import StudentDashboardPage from '../features/dashboard/pages/StudentDashboardPage';
import SandboxPage from '../features/sandbox/pages/SandboxPage';
import StudentActivityListPage from '../features/atividades/pages/StudentActivityListPage';
import StudentActivityDetailPage from '../features/atividades/pages/StudentActivityDetailPage';
import CodeSubmissionPage from '../features/submissoes/pages/CodeSubmissionPage';
import StudentSubmissionsPage from '../features/submissoes/pages/StudentSubmissionsPage';
import StudentSubmissionDetailPage from '../features/submissoes/pages/StudentSubmissionDetailPage';
import StudentHistoryPage from '../features/atividades/pages/StudentHistoryPage';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <LandingPage />;
  if (String(user.perfil || user.tipo || '').toUpperCase() === 'ADMIN') return <Navigate to="/admin/professores" replace />;
  return <Navigate to="/turmas" replace />;
}

function SubmissoesDispatcher() {
  const { isProfessor } = useAuth();
  if (isProfessor) {
    return <SubmissionListPage />;
  }
  return <Navigate to="/aluno/submissoes" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Tela Inicial Pública */}
      <Route path="/" element={<LandingPage />} />

      {/* Login público */}
      <Route path="/login" element={<LoginPage />} />

      <Route path="/turmas" element={<ProtectedRoute><MinhasTurmasPage /></ProtectedRoute>} />

      <Route path="admin/professores" element={<ProtectedRoute allowedRoles={['admin']}><AdminTeachersPage /></ProtectedRoute>} />

      {/* Rotas protegidas com Layout */}
      <Route
        element={
          <ProtectedRoute>
            <RequireTurma><Layout /></RequireTurma>
          </ProtectedRoute>
        }
      >
        {/* Rota autenticada base /app ou redirect */}
        <Route path="app" element={<HomeRedirect />} />

        {/* ===== PROFESSOR ===== */}
        <Route path="atividades/:uuid/editar" element={<ProtectedRoute allowedRoles={['professor']}><CreateActivityWizard /></ProtectedRoute>} />
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
        {/* Funções - restrito a professor */}
        <Route
          path="funcoes"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <FunctionLibraryPage />
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
          path="atividades/:uuid/submissoes"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <SubmissionListPage />
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
            <ProtectedRoute>
              {/* Se aluno tentar acessar /submissoes diretamente, vai para /aluno/submissoes */}
              <SubmissoesDispatcher />
            </ProtectedRoute>
          }
        />
        <Route path="submissoes/:uuid" element={<ProtectedRoute allowedRoles={['professor']}><ProfessorSubmissionDetailPage /></ProtectedRoute>} />
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
          path="aluno/dashboard"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />
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
          path="aluno/submissoes"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <StudentSubmissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="aluno/historico"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <StudentHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="aluno/submissoes/:uuid"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <StudentSubmissionDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="aluno/atividades/:uuid/funcao/:funcaoUuid/submissoes"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <StudentSubmissionsPage />
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
            <TurmaProvider>
              <AppRoutes />
            </TurmaProvider>
          </BrowserRouter>
        </SnackbarProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}
