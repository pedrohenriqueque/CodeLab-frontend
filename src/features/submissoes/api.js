/**
 * API services para Submissões.
 */

import httpClient from '../../shared/api/httpClient';

function adaptSubmission(submissao, index) {
  const hasResult = submissao.nota !== null && submissao.nota !== undefined;
  return {
    ...submissao,
    funcaoUuid: submissao.funcaoAtividadeUuid,
    atividadeUuid: submissao.atividadeUuid,
    funcaoNome: submissao.funcaoNome,
    atividadeTitulo: submissao.atividadeTitulo,
    dataSubmissao: submissao.recebidaEm,
    codigoSubmetido: submissao.codigoFonte,
    pontosTotal: submissao.notaMaxima == null ? undefined : Number(submissao.notaMaxima),
    nota: submissao.nota == null ? null : Number(submissao.nota),
    tentativaNumero: index == null ? undefined : index + 1,
    resultadoJson: hasResult || submissao.falhaTecnica
      ? {
          nota: submissao.nota == null ? 0 : Number(submissao.nota),
          pontosMaximo: submissao.notaMaxima == null ? 0 : Number(submissao.notaMaxima),
          totalCasos: submissao.totalCasos ?? 0,
          casosPassados: submissao.casosAprovados ?? 0,
          falhaTecnica: submissao.falhaTecnica,
        }
      : null,
  };
}

export async function getSubmissoes(funcaoUuid, status, atividadeUuid, alunoUuid) {
  const { data } = await httpClient.get('/api/submissoes');
  return (Array.isArray(data) ? data : []).map((item, index) => adaptSubmission(item, index));
}

export async function getSubmissao(uuid) {
  const { data } = await httpClient.get(`/api/submissoes/${uuid}`);
  return adaptSubmission(data);
}

export async function createSubmissao(funcaoAtividadeUuid, codigoFonte) {
  const { data } = await httpClient.post('/api/submissoes', {
    funcaoAtividadeUuid,
    codigoFonte,
  });
  return data;
}

export async function updateSubmissaoFeedback(uuid, feedbackProfessor) {
  const { data } = await httpClient.patch(`/api/submissoes/${uuid}/feedback`, {
    feedbackProfessor,
  });
  return data;
}
