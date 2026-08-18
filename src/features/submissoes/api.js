/**
 * API services para Submissões.
 */

import httpClient from '../../shared/api/httpClient';

export async function getSubmissoes(funcaoUuid, status) {
  const params = {};
  if (funcaoUuid) params.funcao_uuid = funcaoUuid;
  if (funcaoUuid) params.funcaoUuid = funcaoUuid;
  if (status) params.status = status;
  const { data } = await httpClient.get('/api/submissoes', { params });
  return data;
}

export async function getSubmissao(uuid) {
  const { data } = await httpClient.get(`/api/submissoes/${uuid}`);
  return data;
}

export async function createSubmissao(funcaoUuid, codigo) {
  const { data } = await httpClient.post('/api/submissoes', {
    funcaoUuid,
    codigo,
  });
  return data;
}

export async function updateSubmissaoFeedback(uuid, feedbackProfessor) {
  const { data } = await httpClient.patch(`/api/submissoes/${uuid}/feedback`, {
    feedbackProfessor,
  });
  return data;
}
