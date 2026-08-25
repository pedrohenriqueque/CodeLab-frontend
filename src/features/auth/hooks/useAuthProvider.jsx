/**
 * AuthContext + AuthProvider — gerencia sessão do usuário e autenticação/registro.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginApi, registerApi, logoutApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicialização: restaura sessão do localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('codelab_user');
      const savedToken = localStorage.getItem('codelab_token');
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem('codelab_user');
      localStorage.removeItem('codelab_token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, senha) => {
    const { user: userData, token } = await loginApi(email, senha);
    localStorage.setItem('codelab_token', token);
    localStorage.setItem('codelab_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (dados) => {
    const { user: userData, token } = await registerApi(dados);
    localStorage.setItem('codelab_token', token);
    localStorage.setItem('codelab_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    logoutApi();
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isProfessor: user?.tipo === 'professor',
    isAluno: user?.tipo === 'aluno',
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acessar o contexto de autenticação.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
