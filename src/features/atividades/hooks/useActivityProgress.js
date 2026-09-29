import { useCallback, useEffect, useState } from 'react';
import { getProgressoAtividade } from '../api';

export default function useActivityProgress(activityUuid) {
  const [progresso, setProgresso] = useState([]);
  const refetch = useCallback(async () => {
    if (!activityUuid) return;
    try {
      const funcoes = await getProgressoAtividade(activityUuid);
      setProgresso(funcoes.map((funcao) => ({
        ...funcao,
        funcaoUuid: funcao.funcaoAtividadeUuid,
        tentativasUsadas: funcao.totalTentativas != null ? Number(funcao.totalTentativas) : (funcao.enviada ? 1 : 0),
        melhorNota: funcao.melhorNota == null ? null : Number(funcao.melhorNota),
      })));
    }
    catch { setProgresso([]); }
  }, [activityUuid]);
  useEffect(() => { refetch(); }, [refetch]);
  return { progresso, refetch };
}
