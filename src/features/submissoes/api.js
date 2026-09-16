/**
 * API services para Submissões.
 */

import httpClient from '../../shared/api/httpClient';

export async function getSubmissoes(funcaoUuid, status, atividadeUuid, alunoUuid) {
  const params = {};
  if (funcaoUuid) params.funcaoUuid = funcaoUuid;
  if (atividadeUuid) params.atividadeUuid = atividadeUuid;
  if (alunoUuid) params.alunoUuid = alunoUuid;
  if (status) params.status = status;
  const { data } = await httpClient.get('/api/submissoes', { params });
  return data;
}

export async function getSubmissao(uuid) {
  const { data } = await httpClient.get(`/api/submissoes/${uuid}`);
  return data;
}

export async function createSubmissao(funcaoUuidOrObj, codigo, atividadeUuid) {
  let payload = {};
  if (typeof funcaoUuidOrObj === 'object' && funcaoUuidOrObj !== null) {
    payload = funcaoUuidOrObj;
  } else {
    payload = {
      funcaoUuid: funcaoUuidOrObj,
      codigo,
    };
    if (atividadeUuid) {
      payload.atividadeUuid = atividadeUuid;
    }
  }

  const { data } = await httpClient.post('/api/submissoes', payload);
  return data;
}

export async function updateSubmissaoFeedback(uuid, feedbackProfessor) {
  const { data } = await httpClient.patch(`/api/submissoes/${uuid}/feedback`, {
    feedbackProfessor,
  });
  return data;
}
