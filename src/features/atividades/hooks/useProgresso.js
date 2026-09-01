import { useState, useEffect, useCallback } from 'react';
import { getProgressoAluno } from '../api';

export default function useProgresso(alunoUuid) {
  const [progresso, setProgresso] = useState([]);
  const [loading, setLoading] = useState(!!alunoUuid);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!alunoUuid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProgressoAluno(alunoUuid);
      setProgresso(data?.progresso || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erro ao carregar progresso');
    } finally {
      setLoading(false);
    }
  }, [alunoUuid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { progresso, loading, error, refetch: fetchData };
}
