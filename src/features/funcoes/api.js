/**
 * API services dedicados para a Biblioteca de Funções e Casos de Teste Canônicos.
 */

import httpClient from '../../shared/api/httpClient';

export async function getBibliotecaFuncoes(params = {}) {
  const { data } = await httpClient.get('/api/funcoes', { params });
  return data;
}

export async function getFuncaoDetalhe(uuid) {
  const { data } = await httpClient.get(`/api/funcoes/${uuid}`);
  return data;
}

export async function createFuncao(body) {
  const { data } = await httpClient.post('/api/funcoes', body);
  return data;
}

export async function updateFuncao(uuid, body) {
  const { data } = await httpClient.put(`/api/funcoes/${uuid}`, body);
  return data;
}

export async function deleteFuncao(uuid) {
  await httpClient.delete(`/api/funcoes/${uuid}`);
}

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
