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
        funcaoUuid: funcao.funcaoAtividadeUuid || funcao.funcao_atividade_uuid,
        tentativasUsadas: funcao.totalTentativas != null ? Number(funcao.totalTentativas) : (funcao.total_tentativas != null ? Number(funcao.total_tentativas) : (funcao.enviada ? 1 : 0)),
        melhorNota: funcao.melhorNota == null ? (funcao.melhor_nota == null ? null : Number(funcao.melhor_nota)) : Number(funcao.melhorNota),
        melhorTentativaUuid: funcao.melhorTentativaUuid || funcao.melhor_tentativa_uuid || null,
        ultimaTentativaUuid: funcao.ultimaTentativaUuid || funcao.ultima_tentativa_uuid || null,
      })));
    }
    catch { setProgresso([]); }
  }, [activityUuid]);
  useEffect(() => { refetch(); }, [refetch]);
  return { progresso, refetch };
}
