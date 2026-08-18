/**
 * Hook para buscar detalhe de uma atividade (com funções).
 */

import { useState, useEffect, useCallback } from 'react';
import { getAtividade } from '../api';

export default function useAtividadeDetail(uuid) {
  const [atividade, setAtividade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAtividade(uuid);
      setAtividade(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erro ao carregar atividade');
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { atividade, loading, error, refetch: fetchData };
}
