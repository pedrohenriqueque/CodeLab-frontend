/**
 * Auth API — chamadas de autenticação e registro.
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
  formData.append('username', email.trim());
  formData.append('password', senha);

  try {
    const { data } = await httpClient.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
    const { data: user } = await httpClient.get('/api/auth/me', { headers: { Authorization: `Bearer ${data.accessToken}` } });
    return {
      user: { ...user, perfil: user.perfil || payload.perfil },
      token: data.accessToken,
    };
  } catch (error) {
    if (error.response?.data?.erro) {
      throw new Error(error.response.data.erro);
    }
    if (error.response?.status === 401) {
      throw new Error('E-mail ou senha incorretos. Verifique suas credenciais.');
    }
    throw new Error('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
  }
}

/**
 * Realiza o cadastro de um novo aluno.
 * @param {object} dados - { nome, matricula, email, senha }
 * @returns {Promise<{user: object, token: string}>}
 */
export async function registerApi({ nome, matricula, email, senha }) {
  try {
    const { data } = await httpClient.post('/api/auth/cadastro', {
      nome: nome.trim(),
      matricula: matricula.trim(),
      email: email.trim().toLowerCase(),
      senha,
    });

    return {
      user: data.usuario,
      token: data.accessToken,
    };
  } catch (error) {
    if (error.response?.data?.erro) {
      throw new Error(error.response.data.erro);
    }
    if (error.response?.status === 409) {
      throw new Error('Este e-mail institucional já possui cadastro no CodeLab.');
    }
    throw new Error('Não foi possível realizar o cadastro no momento. Tente novamente.');
  }
}

/**
 * Redefine a senha do usuário com base no e-mail institucional.
 * @param {string} email
 * @param {string} novaSenha
 * @returns {Promise<{message: string}>}
 */
export async function resetPasswordApi(email, novaSenha) {
  try {
    const { data } = await httpClient.post('/api/auth/reset-password', {
      email: email.trim().toLowerCase(),
      novaSenha,
    });
    return data;
  } catch (error) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    if (error.response?.status === 404) {
      throw new Error('Não encontramos nenhuma conta vinculada a este e-mail institucional.');
    }
    throw new Error('Não foi possível redefinir a senha no momento. Tente novamente.');
  }
}

/**
 * Faz logout (limpa sessão).
 */
export function logoutApi() {
  localStorage.removeItem('codelab_token');
  localStorage.removeItem('codelab_user');
}
