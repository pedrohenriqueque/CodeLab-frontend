/**
 * API services dedicados para a Biblioteca de Funções e Casos de Teste Canônicos.
 */

import httpClient from '../../shared/api/httpClient';

export async function getBibliotecaFuncoes() {
  const { data } = await httpClient.get('/api/funcoes');
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
  const { data } = await httpClient.patch(`/api/funcoes/${uuid}`, body);
  return data;
}

export async function deleteFuncao(uuid) {
  await httpClient.delete(`/api/funcoes/${uuid}`);
}

export async function duplicarFuncao(uuid) {
  const { data } = await httpClient.post(`/api/funcoes/${uuid}/duplicar`);
  return data;
}

export async function getCasosTeste(funcaoUuid) {
  const { data } = await httpClient.get(`/api/funcoes/${funcaoUuid}/casos`);
  return data;
}

export async function createCasosTeste(funcaoUuid, body) {
  const { data } = await httpClient.post(`/api/funcoes/${funcaoUuid}/casos`, body);
  return data;
}

export async function updateCasoTeste(casoUuid, body) {
  const { data } = await httpClient.patch(`/api/casos/${casoUuid}`, body);
  return data;
}

export async function deleteCasoTeste(casoUuid) {
  await httpClient.delete(`/api/casos/${casoUuid}`);
}
