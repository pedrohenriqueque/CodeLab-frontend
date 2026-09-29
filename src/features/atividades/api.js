/**
 * API services para Atividades, Funções e Casos de Teste.
 *
 * Funções puras que chamam o backend — sem JSX, sem state.
 */

import httpClient from '../../shared/api/httpClient';

function adaptAtividade(atividade) {
  return {
    ...atividade,
    // Mantém compatibilidade visual com os componentes existentes.
    dataAbertura: atividade.inicioEm,
    dataFechamento: atividade.fimEm,
  };
}

// ============================================================
// ATIVIDADES
// ============================================================

export async function getAtividades(turmaUuid) {
  const atividades = await getAtividadesResumo(turmaUuid);
  return Promise.all(atividades.map(async (atividade) => ({
    ...atividade,
    funcoes: await getFuncoesAtividade(atividade.uuid),
  })));
}

export async function getAtividadesResumo(turmaUuid) {
  const { data } = await httpClient.get('/api/atividades');
  const atividades = turmaUuid ? data.filter((atividade) => atividade.turmaUuid === turmaUuid) : data;
  return atividades.map(adaptAtividade);
}

export async function getAtividade(uuid) {
  const { data } = await httpClient.get(`/api/atividades/${uuid}`);
  return adaptAtividade(data);
}

import { adaptCasoTeste } from '../funcoes/api';
export { adaptCasoTeste };

export async function getFuncoesAtividade(atividadeUuid, options = {}) {
  const params = {};
  if (options.visiveisApenas) {
    params.visiveis_apenas = true;
  }
  const { data } = await httpClient.get(`/api/atividades/${atividadeUuid}/funcoes`, { params });
  return (Array.isArray(data) ? data : []).map((funcao) => {
    const rawCases = funcao.casosTeste || funcao.casos_teste || [];
    return {
      ...funcao,
      funcaoUuid: funcao.uuid,
      nomeFuncao: funcao.nome || funcao.nomeFuncao || funcao.nome_funcao,
      descricao: funcao.enunciado || funcao.descricao,
      peso: Number(funcao.notaMaxima ?? funcao.nota_maxima ?? 0),
      casosTeste: rawCases.map(adaptCasoTeste),
    };
  });
}

export async function createAtividade(body) {
  const { data } = await httpClient.post('/api/atividades', body);
  return adaptAtividade(data);
}

export async function updateAtividade(uuid, body) {
  const { data } = await httpClient.patch(`/api/atividades/${uuid}`, body);
  return adaptAtividade(data);
}

export async function publicarAtividade(atividadeUuid) {
  const { data } = await httpClient.post(`/api/atividades/${atividadeUuid}/publicar`);
  return data;
}

export async function encerrarAtividade(atividadeUuid) {
  const { data } = await httpClient.post(`/api/atividades/${atividadeUuid}/encerrar`);
  return adaptAtividade(data);
}

export async function deleteAtividade(atividadeUuid) {
  await httpClient.delete(`/api/atividades/${atividadeUuid}`);
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
  const { data } = await httpClient.get(`/api/funcoes/${funcaoUuid}/casos`);
  return (Array.isArray(data) ? data : []).map(adaptCasoTeste);
}

export async function createCasosTeste(funcaoUuid, body) {
  const { data } = await httpClient.post(`/api/funcoes/${funcaoUuid}/casos`, body);
  return adaptCasoTeste(data);
}

export async function updateCasoTeste(funcaoUuidOrCasoUuid, maybeCasoUuidOrBody, maybeBody) {
  let casoUuid = funcaoUuidOrCasoUuid;
  let body = maybeCasoUuidOrBody;
  if (maybeBody !== undefined) {
    casoUuid = maybeCasoUuidOrBody;
    body = maybeBody;
  }
  const { data } = await httpClient.patch(`/api/casos/${casoUuid}`, body);
  return adaptCasoTeste(data);
}

export async function deleteCasoTeste(funcaoUuidOrCasoUuid, maybeCasoUuid) {
  const casoUuid = maybeCasoUuid || funcaoUuidOrCasoUuid;
  await httpClient.delete(`/api/casos/${casoUuid}`);
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

export async function getProgressoAtividade(atividadeUuid) {
  const { data } = await httpClient.get(`/api/atividades/${atividadeUuid}/progresso`);
  return data.funcoes || [];
}
