import { useState, useEffect, useCallback } from 'react';
import { getAtividades } from '../api';
import { useTurmaContext } from '../../turmas/context/TurmaContext';

export default function useAtividades(explicitTurmaUuid) {
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tenta obter turma ativa se nenhum UUID explícito for fornecido
  let contextTurmaUuid = null;
  try {
    const turmaCtx = useTurmaContext();
    contextTurmaUuid = turmaCtx?.turmaAtiva?.uuid || null;
  } catch {
    // Fora do TurmaContext (fallback)
    contextTurmaUuid = null;
  }

  const effectiveTurmaUuid = explicitTurmaUuid !== undefined ? explicitTurmaUuid : contextTurmaUuid;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAtividades(effectiveTurmaUuid);
      setAtividades(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  }, [effectiveTurmaUuid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { atividades, loading, error, refetch: fetchData, turmaUuid: effectiveTurmaUuid };
}
