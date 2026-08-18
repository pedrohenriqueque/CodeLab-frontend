/**
 * API services para Atividades, Funções e Casos de Teste.
 *
 * Funções puras que chamam o backend — sem JSX, sem state.
 */

import httpClient from '../../shared/api/httpClient';

// ============================================================
// ATIVIDADES
// ============================================================

export async function getAtividades() {
  const { data } = await httpClient.get('/api/atividades');
  return data;
}

export async function getAtividade(uuid) {
  const { data } = await httpClient.get(`/api/atividades/${uuid}`);
  return data;
}

export async function createAtividade(body) {
  const { data } = await httpClient.post('/api/atividades', body);
  return data;
}

export async function updateAtividade(uuid, body) {
  const { data } = await httpClient.patch(`/api/atividades/${uuid}`, body);
  return data;
}

// ============================================================
// FUNÇÕES
// ============================================================

export async function getFuncoes(atividadeUuid) {
  const params = atividadeUuid ? { atividadeUuid } : {};
  const { data } = await httpClient.get('/api/funcoes', { params });
  return data;
}

export async function getFuncao(uuid) {
  const { data } = await httpClient.get(`/api/funcoes/${uuid}`);
  return data;
}

export async function createFuncao(atividadeUuid, body) {
  const { data } = await httpClient.post('/api/funcoes', body, {
    params: { atividadeUuid },
  });
  return data;
}

// ============================================================
// CASOS DE TESTE
// ============================================================

export async function getCasosTeste(funcaoUuid) {
  const { data } = await httpClient.get(`/api/funcoes/${funcaoUuid}/casos-teste`);
  return data;
}

export async function createCasosTeste(funcaoUuid, body) {
  const { data } = await httpClient.post(`/api/funcoes/${funcaoUuid}/casos-teste`, body);
  return data;
}

// ============================================================
// PROGRESSO
// ============================================================

export async function getProgressoAluno(alunoUuid) {
  const { data } = await httpClient.get('/api/aluno/progresso', {
    params: { alunoUuid },
  });
  return data;
}
