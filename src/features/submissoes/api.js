/**
 * API services para Submissões.
 */

import httpClient from '../../shared/api/httpClient';

function adaptSubmission(submissao, index, total) {
  const hasResult = submissao.nota !== null && submissao.nota !== undefined;
  const totalCasos = submissao.total_casos ?? submissao.totalCasos ?? 0;
  const casosAprovados = submissao.casos_aprovados ?? submissao.casosAprovados ?? 0;
  const notaMaxima = submissao.nota_maxima ?? submissao.notaMaxima;
  const nota = submissao.nota;
  const falhaTecnica = submissao.falha_tecnica ?? submissao.falhaTecnica ?? false;

  let tentativaNumero = submissao.tentativaNumero;
  if (tentativaNumero == null) {
    if (total != null && index != null) {
      tentativaNumero = total - index;
    } else if (index != null) {
      tentativaNumero = index + 1;
    }
  }

  return {
    ...submissao,
    uuid: submissao.uuid,
    funcaoUuid: submissao.funcao_atividade_uuid || submissao.funcaoAtividadeUuid || submissao.funcaoUuid,
    atividadeUuid: submissao.atividade_uuid || submissao.atividadeUuid,
    funcaoNome: submissao.funcao_nome || submissao.funcaoNome,
    atividadeTitulo: submissao.atividade_titulo || submissao.atividadeTitulo,
    atividadeTipo: submissao.atividade_tipo || submissao.atividadeTipo || (submissao.tipo || 'EXERCICIO'),
    dataSubmissao: submissao.recebida_em || submissao.recebidaEm || submissao.dataSubmissao,
    avaliadaEm: submissao.avaliada_em || submissao.avaliadaEm,
    dataAtualizacao: submissao.avaliada_em || submissao.avaliadaEm || submissao.recebida_em || submissao.recebidaEm || submissao.dataSubmissao,
    codigoSubmetido: submissao.codigo_fonte || submissao.codigoFonte || submissao.codigoSubmetido,
    pontosTotal: notaMaxima == null ? undefined : Number(notaMaxima),
    notaMaxima: notaMaxima == null ? 10 : Number(notaMaxima),
    nota: nota == null ? null : Number(nota),
    totalCasos: Number(totalCasos),
    casosAprovados: Number(casosAprovados),
    falhaTecnica,
    tentativaNumero,
    erroCompilacao: submissao.erro_compilacao || submissao.erroCompilacao || (submissao.status === 'ERRO_COMPILACAO' ? (submissao.mensagemErro || 'Erro durante a compilação do código C.') : null),
    resultadosCasos: submissao.resultados_casos || submissao.resultadosCasos || null,
    resultadoJson: hasResult || falhaTecnica
      ? {
          nota: nota == null ? 0 : Number(nota),
          pontosMaximo: notaMaxima == null ? 0 : Number(notaMaxima),
          totalCasos: Number(totalCasos),
          casosPassados: Number(casosAprovados),
          falhaTecnica,
        }
      : null,
  };
}

export async function getSubmissoes(funcaoUuid, status, atividadeUuid, alunoUuid) {
  const params = {};
  if (funcaoUuid) params.funcaoUuid = funcaoUuid;
  if (status) params.status = status;
  if (atividadeUuid) params.atividadeUuid = atividadeUuid;
  if (alunoUuid) params.alunoUuid = alunoUuid;

  const { data } = await httpClient.get('/api/submissoes', {
    params: Object.keys(params).length ? params : undefined,
  });
  const list = Array.isArray(data) ? data : [];
  return list.map((item, index) => adaptSubmission(item, index, list.length));
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
  return adaptSubmission({ ...data, codigo_fonte: codigoFonte });
}

export async function updateSubmissaoFeedback(uuid, feedbackProfessor) {
  const { data } = await httpClient.patch(`/api/submissoes/${uuid}/feedback`, {
    feedbackProfessor,
  });
  return data;
}

