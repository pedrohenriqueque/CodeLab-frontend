/**
 * Auth API — chamadas de autenticação.
 *
 * Stub: até o backend implementar /api/auth/login,
 * usamos dados mockados para desenvolvimento do frontend.
 */

import httpClient from '../../shared/api/httpClient';

/**
 * Faz login com email e senha.
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<{user: object, token: string}>}
 */
export async function loginApi(email, senha) {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', senha);

  const { data } = await httpClient.post('/api/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  return {
    user: data.user,
    token: data.access_token,
  };
}

/**
 * Faz logout (limpa sessão).
 */
export function logoutApi() {
  localStorage.removeItem('codelab_token');
  localStorage.removeItem('codelab_user');
}
