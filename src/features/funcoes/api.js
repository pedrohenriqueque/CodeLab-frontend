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

export function adaptCasoTeste(caso, index = 0) {
  if (!caso) return null;
  const isOculto = caso.visibilidade !== undefined
    ? String(caso.visibilidade).toUpperCase() === 'OCULTO'
    : Boolean(caso.oculto);
  const visibilidade = isOculto ? 'OCULTO' : 'VISIVEL';
  const rawEntradas = caso.entradas ?? caso.inputs ?? [];
  const rawSaida = caso.retornoEsperado ?? caso.retorno_esperado ?? caso.outputEsperado ?? caso.output_esperado;

  return {
    ...caso,
    uuid: caso.uuid || caso.casoTesteUuid || caso.caso_teste_uuid || '',
    casoTesteUuid: caso.uuid || caso.casoTesteUuid || caso.caso_teste_uuid || '',
    numero: caso.numero ?? (index + 1),
    entradas: rawEntradas,
    inputs: rawEntradas,
    retornoEsperado: rawSaida,
    outputEsperado: rawSaida,
    visibilidade,
    oculto: isOculto,
    visible: !isOculto,
    peso: Number(caso.peso ?? caso.pesoCaso ?? 1),
    pesoCaso: Number(caso.peso ?? caso.pesoCaso ?? 1),
    descricao: caso.descricao || '',
  };
}

export async function getCasosTeste(funcaoUuid) {
  const { data } = await httpClient.get(`/api/funcoes/${funcaoUuid}/casos`);
  return (Array.isArray(data) ? data : []).map(adaptCasoTeste);
}

export function getFunctionTestCaseCount(funcao) {
  const total = funcao.totalCasosTeste ?? funcao.total_casos_teste;
  if (total != null) return Number(total);
  const casos = funcao.casosTeste ?? funcao.casos_teste;
  return Array.isArray(casos) ? casos.length : undefined;
}

export async function getCasosParaAtividade(funcao) {
  const existentes = funcao.casosTeste ?? funcao.casos_teste;
  const casos = Array.isArray(existentes) && existentes.length
    ? existentes.map(adaptCasoTeste)
    : await getCasosTeste(funcao.uuid);
  if (!casos.length) {
    throw new Error('Cadastre ao menos um caso de teste na função antes de adicioná-la à atividade.');
  }
  return casos;
}

export async function createCasosTeste(funcaoUuid, body) {
  const { data } = await httpClient.post(`/api/funcoes/${funcaoUuid}/casos`, body);
  return adaptCasoTeste(data);
}

export async function updateCasoTeste(casoUuid, body) {
  const { data } = await httpClient.patch(`/api/casos/${casoUuid}`, body);
  return adaptCasoTeste(data);
}

export async function deleteCasoTeste(casoUuid) {
  await httpClient.delete(`/api/casos/${casoUuid}`);
}
