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

export async function entregarAtividade(atividadeUuid) {
  const { data } = await httpClient.post(`/api/atividades/${atividadeUuid}/entregar`);
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

export async function updateFuncao(funcaoUuid, body) {
  const { data } = await httpClient.put(`/api/funcoes/${funcaoUuid}`, body);
  return data;
}

export async function deleteFuncao(funcaoUuid) {
  await httpClient.delete(`/api/funcoes/${funcaoUuid}`);
}

// ============================================================
// ASSOCIAÇÃO ATIVIDADE × FUNÇÃO (N:N)
// ============================================================

export async function associarFuncaoAtividade(atividadeUuid, body) {
  const { data } = await httpClient.post(`/api/atividades/${atividadeUuid}/funcoes`, body);
  return data;
}

export async function atualizarFuncaoAtividade(atividadeUuid, funcaoUuid, body) {
  const { data } = await httpClient.patch(`/api/atividades/${atividadeUuid}/funcoes/${funcaoUuid}`, body);
  return data;
}

export async function removerFuncaoAtividade(atividadeUuid, funcaoUuid) {
  await httpClient.delete(`/api/atividades/${atividadeUuid}/funcoes/${funcaoUuid}`);
}

// ============================================================
// CASOS DE TESTE (CANÔNICOS NA BIBLIOTECA)
// ============================================================

export async function getCasosTeste(funcaoUuid) {
  const { data } = await httpClient.get(`/api/funcoes/${funcaoUuid}/casos-teste`);
  return data;
}

export async function createCasosTeste(funcaoUuid, body) {
  const { data } = await httpClient.post(`/api/funcoes/${funcaoUuid}/casos-teste`, body);
  return data;
}

export async function updateCasoTeste(funcaoUuid, casoUuid, body) {
  const { data } = await httpClient.put(`/api/funcoes/${funcaoUuid}/casos-teste/${casoUuid}`, body);
  return data;
}

export async function deleteCasoTeste(funcaoUuid, casoUuid) {
  await httpClient.delete(`/api/funcoes/${funcaoUuid}/casos-teste/${casoUuid}`);
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
