import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getTurmas } from '../api';
import { useAuth } from '../../auth/hooks/useAuthProvider';

const TurmaContext = createContext(null);
const STORAGE_KEY = 'codelab_turma_ativa_uuid';

export function TurmaProvider({ children }) {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState([]);
  const [turmaAtiva, setTurmaAtivaState] = useState(null);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [errorTurmas, setErrorTurmas] = useState(null);

  const fetchTurmas = useCallback(async () => {
    if (!user) {
      setTurmas([]);
      setTurmaAtivaState(null);
      return;
    }
    setLoadingTurmas(true);
    setErrorTurmas(null);
    try {
      const data = await getTurmas();
      const list = Array.isArray(data) ? data : [];
      setTurmas(list);
      const savedUuid = localStorage.getItem(STORAGE_KEY);
      const encontrada = list.find((turma) => turma.uuid === savedUuid);
      setTurmaAtivaState(encontrada || null);
      if (!encontrada) localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
      setErrorTurmas(err.response?.data?.detail || err.message || 'Erro ao carregar turmas');
    } finally {
      setLoadingTurmas(false);
    }
  }, [user]);

  useEffect(() => { fetchTurmas(); }, [fetchTurmas]);

  const setTurmaAtiva = useCallback((turma) => {
    setTurmaAtivaState(turma || null);
    if (turma) localStorage.setItem(STORAGE_KEY, turma.uuid);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  return <TurmaContext.Provider value={{ turmas, turmaAtiva, setTurmaAtiva, loadingTurmas, errorTurmas, refreshTurmas: fetchTurmas }}>{children}</TurmaContext.Provider>;
}

export function useTurmaContext() {
  const ctx = useContext(TurmaContext);
  if (!ctx) throw new Error('useTurmaContext deve ser utilizado dentro de um TurmaProvider');
  return ctx;
}
