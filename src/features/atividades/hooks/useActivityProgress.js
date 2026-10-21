import { useCallback, useEffect, useRef, useState } from 'react';
import { getProgressoAtividade } from '../api';

export default function useActivityProgress(activityUuid) {
  const [progresso, setProgresso] = useState([]);
  const requestId = useRef(0);
  const refetch = useCallback(() => {
    if (!activityUuid) return;
    const id = ++requestId.current;
    return getProgressoAtividade(activityUuid).then((funcoes) => {
      if (id === requestId.current) setProgresso(funcoes);
    }, () => {
      if (id === requestId.current) setProgresso([]);
    });
  }, [activityUuid]);
  useEffect(() => {
    refetch();
    return () => { requestId.current += 1; };
  }, [refetch]);
  return { progresso, refetch };
}
