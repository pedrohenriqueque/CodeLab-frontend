/**
 * Hook para buscar a lista de atividades com loading/error.
 */

import { useState, useEffect, useCallback } from 'react';
import { getAtividades } from '../api';

export default function useAtividades() {
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAtividades();
      setAtividades(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { atividades, loading, error, refetch: fetchData };
}
