import { useState, useEffect, useCallback, useRef } from 'react';
import { getAtividades } from '../api';
import { useTurmaContext } from '../../turmas/context/TurmaContext';

export default function useAtividades(explicitTurmaUuid) {
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  const [loadedTurmaUuid, setLoadedTurmaUuid] = useState(undefined);

  // Tenta obter turma ativa se nenhum UUID explícito for fornecido
  let contextTurmaUuid;
  try {
    const turmaCtx = useTurmaContext();
    contextTurmaUuid = turmaCtx?.turmaAtiva?.uuid || null;
  } catch {
    // Fora do TurmaContext (fallback)
    contextTurmaUuid = null;
  }

  const effectiveTurmaUuid = explicitTurmaUuid !== undefined ? explicitTurmaUuid : contextTurmaUuid;

  const fetchData = useCallback(() => {
    const id = ++requestId.current;
    return getAtividades(effectiveTurmaUuid).then((data) => {
      if (id === requestId.current) {
        setAtividades(data);
        setLoadedTurmaUuid(effectiveTurmaUuid);
        setError(null);
        setLoading(false);
      }
    }, (err) => {
      if (id === requestId.current) {
        setAtividades([]);
        setLoadedTurmaUuid(effectiveTurmaUuid);
        setError(err.response?.data?.detail || err.message || 'Erro ao carregar atividades');
        setLoading(false);
      }
    });
  }, [effectiveTurmaUuid]);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    return () => { requestId.current += 1; };
  }, [fetchData]);

  const current = loadedTurmaUuid === effectiveTurmaUuid;
  return { atividades: current ? atividades : [], loading: loading || !current,
    error: current ? error : null, refetch, turmaUuid: effectiveTurmaUuid };
}
