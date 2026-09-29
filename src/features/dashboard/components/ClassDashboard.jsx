/**
 * ClassDashboard — Roteador de Dashboard por Perfil (Professor / Aluno).
 *
 * Delega a renderização para:
 * - ProfessorDashboardView: visão docente com indicadores e gestão.
 * - StudentDashboardView: visão discente moderna com métricas e seções para fazer / em andamento.
 */

import { useEffect, useState } from 'react';
import { Alert } from '@mui/material';
import { dashboardApi } from '../api';
import { useTurmaContext } from '../../turmas/context/TurmaContext';
import { useAuth } from '../../auth/hooks/useAuthProvider';
import ProfessorDashboardView from './ProfessorDashboardView';
import StudentDashboardView from './StudentDashboardView';

export default function ClassDashboard({ professor }) {
  const { turmaAtiva } = useTurmaContext();
  const { user } = useAuth();
  const [state, setState] = useState({ data: null, error: '', key: null });
  const [reload, setReload] = useState(0);
  const turmaUuid = turmaAtiva?.uuid;
  const key = `${turmaUuid}:${professor}:${reload}`;

  useEffect(() => {
    let active = true;
    if (!turmaUuid) return undefined;
    const request = professor ? dashboardApi.getEstatisticas : dashboardApi.getDashboardAluno;
    request(turmaUuid)
      .then((data) => {
        if (active) setState({ data, error: '', key });
      })
      .catch(() => {
        if (active) {
          setState({
            data: null,
            error: 'Não foi possível carregar o início desta turma.',
            key,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [turmaUuid, professor, key]);

  if (!turmaUuid) {
    return (
      <Alert severity="info" sx={{ borderRadius: '12px' }}>
        Selecione uma turma para começar.
      </Alert>
    );
  }

  const loading = state.key !== key;
  const data = loading ? null : state.data;

  if (professor) {
    return (
      <ProfessorDashboardView
        key={turmaUuid}
        data={data}
        turma={turmaAtiva}
        nome={user?.nome}
        loading={loading}
        error={loading ? '' : state.error}
        onRetry={() => setReload((n) => n + 1)}
      />
    );
  }

  return (
    <StudentDashboardView
      key={turmaUuid}
      data={data}
      turma={turmaAtiva}
      user={user}
      loading={loading}
      error={loading ? '' : state.error}
      onRetry={() => setReload((n) => n + 1)}
    />
  );
}
