import { useState, useEffect, useCallback } from 'react';
import { getProgressoAluno } from '../api';

const MOCK_ALUNO_UUID = "a2000000-0000-0000-0000-000000000002"; // Pedro

export default function useProgresso(alunoUuid = MOCK_ALUNO_UUID) {
  const [progresso, setProgresso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
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
