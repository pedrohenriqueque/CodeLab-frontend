/**
 * API services para o domínio neutro de Turmas.
 */

import httpClient from '../../shared/api/httpClient';

export async function getTurmas() {
  const { data } = await httpClient.get('/api/turmas');
  return data;
}

export async function createTurma(body) {
  const { data } = await httpClient.post('/api/turmas', body);
  return data;
}

export async function ingressarTurma(codigo) {
  const { data } = await httpClient.post('/api/turmas/ingressos', { codigo });
  return data;
}
export async function updateTurma(turmaUuid, body) {
  const { data } = await httpClient.patch(`/api/turmas/${turmaUuid}`, body);
  return data;
}
export async function getAlunosTurma(turmaUuid) {
  const { data } = await httpClient.get(`/api/turmas/${turmaUuid}/alunos`);
  return data;
}

export async function removerAlunoTurma(turmaUuid, alunoUuid) {
  await httpClient.delete(`/api/turmas/${turmaUuid}/alunos/${alunoUuid}`);
}

export async function getResultadosTurma(turmaUuid) {
  const { data } = await httpClient.get(`/api/turmas/${turmaUuid}/resultados`);
  return data;
}

// Contratos ainda não existem no backend novo; manter exports evita que telas
// legadas façam chamadas para endpoints fictícios.
const unsupported = () => Promise.reject(new Error('Esta operação ainda não é oferecida pela API nova.'));
export const getTurmaDetalhe = unsupported;
export const adicionarAlunosTurma = unsupported;
export const getAlunosDisponiveis = unsupported;
